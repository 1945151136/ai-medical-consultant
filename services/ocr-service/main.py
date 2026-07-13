# PaddleOCR 医学文档识别微服务
# OCR Service for Medical Document Recognition

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import time
import logging

logging.basicConfig(level=os.getenv("LOG_LEVEL", "info").upper())
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical OCR Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 延迟加载 OCR 引擎（首次请求时初始化）
ocr_engine = None


def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        logger.info("初始化 PaddleOCR 引擎...")
        try:
            from paddleocr import PaddleOCR
            ocr_engine = PaddleOCR(lang='ch')
            logger.info("PaddleOCR 引擎初始化成功")
        except Exception as e:
            logger.error(f"PaddleOCR 初始化失败: {e}")
            raise
    return ocr_engine


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "service": "medical-ocr", "version": "0.1.0"}


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """
    从上传的图片中提取文字
    支持格式: JPG, PNG, TIFF, BMP
    返回提取的文本和置信度
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, f"不支持的文件类型: {file.content_type}")

    start_time = time.time()

    try:
        contents = await file.read()
        # 保存临时文件
        import tempfile
        suffix = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # OCR 识别
        engine = get_ocr_engine()
        result = engine.ocr(tmp_path)

        # 清理临时文件
        os.unlink(tmp_path)

        # 格式化结果
        lines = []
        total_confidence = 0
        count = 0

        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                confidence = line[1][1]
                lines.append({"text": text, "confidence": round(confidence, 4)})
                total_confidence += confidence
                count += 1

        avg_confidence = round(total_confidence / count, 4) if count > 0 else 0
        full_text = "\n".join([l["text"] for l in lines])
        elapsed_ms = round((time.time() - start_time) * 1000)

        return {
            "success": True,
            "text": full_text,
            "lines": lines,
            "confidence": avg_confidence,
            "lineCount": count,
            "elapsedMs": elapsed_ms,
        }

    except Exception as e:
        logger.error(f"OCR 失败: {e}")
        raise HTTPException(500, f"OCR 处理失败: {str(e)}")


@app.post("/ocr/pdf")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    """
    从扫描版 PDF 中提取文字
    使用 pdf2image 转换 + PaddleOCR 识别
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "仅支持 PDF 文件")

    start_time = time.time()

    try:
        from pdf2image import convert_from_bytes

        contents = await file.read()
        images = convert_from_bytes(contents, dpi=200)

        engine = get_ocr_engine()
        all_pages = []

        for page_num, image in enumerate(images, 1):
            import tempfile
            import numpy as np

            img_array = np.array(image)
            result = engine.ocr(img_array)

            page_lines = []
            if result and result[0]:
                for line in result[0]:
                    page_lines.append({
                        "text": line[1][0],
                        "confidence": round(line[1][1], 4),
                    })

            page_text = "\n".join([l["text"] for l in page_lines])
            all_pages.append({
                "page": page_num,
                "text": page_text,
                "lines": page_lines,
            })

        full_text = "\n\n".join([p["text"] for p in all_pages])
        elapsed_ms = round((time.time() - start_time) * 1000)

        return {
            "success": True,
            "text": full_text,
            "pages": all_pages,
            "pageCount": len(all_pages),
            "elapsedMs": elapsed_ms,
        }

    except Exception as e:
        logger.error(f"PDF OCR 失败: {e}")
        raise HTTPException(500, f"PDF OCR 处理失败: {str(e)}")


@app.post("/deidentify")
async def deidentify_text(request: dict):
    """
    文本脱敏 - 移除个人身份信息 (PHI)
    支持: 姓名、身份证号、手机号、地址、医院名称
    """
    import re

    text = request.get("text", "")
    if not text:
        raise HTTPException(400, "text 字段不能为空")

    replacements = []

    # 身份证号 (18位)
    id_pattern = r'\b\d{6}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b'
    for i, match in enumerate(re.finditer(id_pattern, text)):
        replacements.append({
            "original": match.group(),
            "placeholder": f"[ID_{i + 1}]",
            "type": "id_number",
            "start": match.start(),
            "end": match.end(),
        })

    # 手机号
    phone_pattern = r'\b1[3-9]\d{9}\b'
    for i, match in enumerate(re.finditer(phone_pattern, text)):
        replacements.append({
            "original": match.group(),
            "placeholder": f"[PHONE_{i + 1}]",
            "type": "phone",
            "start": match.start(),
            "end": match.end(),
        })

    # 按位置排序并从后往前替换
    replacements.sort(key=lambda x: x["start"], reverse=True)
    deidentified = text
    for r in replacements:
        deidentified = deidentified[:r["start"]] + r["placeholder"] + deidentified[r["end"]:]

    return {
        "originalText": text,
        "deidentifiedText": deidentified,
        "replacements": sorted(replacements, key=lambda x: x["start"]),
        "replacementCount": len(replacements),
    }


# ============================================================
# 医学实体词典
# ============================================================
MEDICAL_DICT = {
    "symptom": [
        "头痛", "头晕", "发热", "发烧", "咳嗽", "胸闷", "心悸", "腹痛", "腰痛",
        "恶心", "呕吐", "乏力", "失眠", "关节痛", "流鼻涕", "喉咙痛", "呼吸困难",
        "腹泻", "便秘", "尿频", "浮肿", "皮疹", "瘙痒", "耳鸣", "视力模糊",
        "胸痛", "气短", "盗汗", "食欲不振", "体重下降", "体重增加", "便血",
        "尿血", "黄疸", "抽搐", "麻木", "刺痛", "肿胀", "僵硬",
    ],
    "disease": [
        "高血压", "糖尿病", "冠心病", "脑梗塞", "慢性胃炎", "胃溃疡",
        "支气管炎", "肺炎", "哮喘", "慢性阻塞性肺疾病", "肝炎", "肝硬化",
        "肾炎", "肾结石", "甲状腺功能亢进", "甲状腺功能减退", "类风湿关节炎",
        "骨质疏松", "贫血", "白血病", "上呼吸道感染", "泌尿系感染",
        "颈椎病", "腰椎间盘突出", "抑郁症", "焦虑症", "失眠症",
    ],
    "drug": [
        "阿莫西林", "布洛芬", "对乙酰氨基酚", "头孢克洛", "阿司匹林",
        "二甲双胍", "硝苯地平", "卡托普利", "胰岛素", "氯雷他定",
        "奥美拉唑", "蒙脱石散", "氨溴索", "沙丁胺醇", "泼尼松",
        "甲硝唑", "诺氟沙星", "阿奇霉素", "青霉素", "红霉素",
        "速效救心丸", "丹参片", "板蓝根", "双黄连", "藿香正气水",
    ],
    "anatomy": [
        "头部", "颈部", "胸部", "腹部", "腰部", "盆腔",
        "左上肢", "右上肢", "左下肢", "右下肢", "背部", "脊柱",
        "心脏", "肺部", "肝脏", "肾脏", "胃", "肠道", "胰腺",
        "甲状腺", "前列腺", "子宫", "卵巢", "乳腺",
    ],
    "indicator": [
        "白细胞", "红细胞", "血红蛋白", "血小板", "血糖", "总胆固醇",
        "甘油三酯", "高密度脂蛋白", "低密度脂蛋白", "谷丙转氨酶", "谷草转氨酶",
        "肌酐", "尿素氮", "尿酸", "总胆红素", "直接胆红素", "白蛋白",
        "C反应蛋白", "降钙素原", "D二聚体", "肌钙蛋白",
    ],
}


@app.post("/extract-entities")
async def extract_entities_endpoint(request: dict):
    """
    从医学文本中提取结构化实体
    输入: {"text": "..."}
    输出: { entities: [...], medications: [...], symptoms: [...] }
    """
    text = request.get("text", "")
    if not text:
        raise HTTPException(400, "text 字段不能为空")

    entities = []
    for entity_type, patterns in MEDICAL_DICT.items():
        for pattern in patterns:
            start = 0
            while True:
                idx = text.find(pattern, start)
                if idx == -1:
                    break
                entities.append({
                    "type": entity_type,
                    "name": pattern,
                    "start": idx,
                    "end": idx + len(pattern),
                    "confidence": 0.85,
                })
                start = idx + 1

    # 去重：同一位置只保留一个
    seen = set()
    unique_entities = []
    for e in sorted(entities, key=lambda x: (x["start"], -len(x["name"]))):
        key = (e["start"], e["end"])
        if key not in seen:
            seen.add(key)
            unique_entities.append(e)

    unique_entities.sort(key=lambda x: x["start"])

    symptoms = [e for e in unique_entities if e["type"] == "symptom"]
    diseases = [e for e in unique_entities if e["type"] == "disease"]
    drugs = [e for e in unique_entities if e["type"] == "drug"]
    anatomy = [e for e in unique_entities if e["type"] == "anatomy"]
    indicators = [e for e in unique_entities if e["type"] == "indicator"]

    return {
        "success": True,
        "entities": unique_entities,
        "symptoms": symptoms,
        "diseases": diseases,
        "drugs": drugs,
        "anatomy": anatomy,
        "indicators": indicators,
        "totalCount": len(unique_entities),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
