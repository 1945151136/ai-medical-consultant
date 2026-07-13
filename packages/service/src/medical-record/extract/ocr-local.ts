// 本地 OCR - 通过子进程调用 Python PaddleOCR
// Local OCR via Python subprocess (no Docker required)

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * 检查 Python 和 PaddleOCR 是否安装
 */
export async function checkPythonOCR(): Promise<boolean> {
  try {
    const result = await runPythonCommand([
      '-c',
      'import paddleocr; print("OK")',
    ]);
    return result.includes('OK');
  } catch {
    return false;
  }
}

/**
 * 使用本地 Python + PaddleOCR 对图片进行 OCR
 */
export async function ocrLocalImage(
  imagePath: string
): Promise<{ text: string; lines: Array<{ text: string; confidence: number }> }> {
  const script = `
import json
from paddleocr import PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False, show_log=False)
result = ocr.ocr("${imagePath.replace(/\\/g, '\\\\')}", cls=True)
lines = []
if result and result[0]:
    for line in result[0]:
        lines.append({"text": line[1][0], "confidence": round(line[1][1], 4)})
full_text = "\\n".join([l["text"] for l in lines])
print(json.dumps({"text": full_text, "lines": lines}))
`;

  const tmpScript = path.join(process.cwd(), 'tmp_ocr.py');
  fs.writeFileSync(tmpScript, script);

  try {
    const output = await runPythonCommand([tmpScript]);
    return JSON.parse(output);
  } finally {
    if (fs.existsSync(tmpScript)) {
      fs.unlinkSync(tmpScript);
    }
  }
}

/**
 * 执行 Python 命令并获取输出
 */
function runPythonCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const proc = spawn(pythonCmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Python 执行失败 (exit ${code}): ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`无法启动 Python: ${err.message}`));
    });
  });
}

/**
 * 安装 PaddleOCR 的 Python 命令（提供给用户）
 */
export function getOCRInstallInstructions(): string {
  return `
# 安装 PaddleOCR (需要 Python 3.8+)
pip install paddleocr paddlepaddle

# 如果安装失败，尝试使用 CPU 版本：
pip install paddlepaddle  # CPU only
pip install paddleocr
`;
}
