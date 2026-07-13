FROM python:3.11-slim

WORKDIR /app

# 系统依赖：OpenCV/PaddlePaddle 需要的底层库 + poppler(PDF转图片)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 安装 PaddlePaddle noavx（兼容老CPU）+ PaddleOCR
# 使用百度 CDN 直链，国内下载快且无 AVX 依赖
RUN pip install --no-cache-dir \
    https://paddle-wheel.bj.bcebos.com/2.6.2/linux/linux-cpu-noavx-mkl/paddlepaddle-2.6.2-cp311-cp311-linux_x86_64.whl \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
