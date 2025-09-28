const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const extractTextFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

const extractTextFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const extractFields = (text) => {
  // Simple regex-based extraction. Can be improved.
  const emailMatch = text.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
  );
  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?(\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4}|\(\d{3}\)\s?\d{3}-\d{4})/
  );
  // For name, naive heuristic: look for lines with capitalized words near top.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let name = "";
  if (lines.length) {
    // pick first line with >1 word and short length
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const l = lines[i];
      if (l.split(" ").length <= 4 && /[A-Z][a-z]/.test(l)) {
        name = l;
        break;
      }
    }
  }
  return {
    text,
    name: name || "",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
  };
};

const parseResume = async (filePath, mimetype) => {
  const buffer = await fs.readFile(filePath);
  let text = "";

  // basic mime detection: use extension as well
  if ((mimetype && mimetype.includes("pdf")) || filePath.endsWith(".pdf")) {
    text = await extractTextFromPDF(buffer);
  } else {
    // try docx
    text = await extractTextFromDocx(filePath);
  }

  const fields = extractFields(text);
  return fields;
};

module.exports = {
  parseResume,
};
