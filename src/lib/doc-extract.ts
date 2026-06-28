// 从 File 提取纯文本：.txt 直接读，.docx 用 mammoth 浏览器端解析
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    // 仅在用户上传 .docx 时按需加载浏览器版 mammoth，避免拖慢首屏 / SSR
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }
  // .txt 及其它纯文本
  return await file.text();
}
