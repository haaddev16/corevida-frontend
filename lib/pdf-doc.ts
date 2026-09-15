const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

function pdfEscape(value: string) {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function color(r: number, g: number, b: number) {
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
}

/** Approximate glyph width for Helvetica metrics used by SimplePdf. */
export function measurePdfText(text: string, fontSize: number, bold = false) {
  const factor = bold ? 0.55 : 0.5;
  return Math.max(0, text.length) * fontSize * factor;
}

export function wrapPdfText(text: string, maxWidth: number, fontSize: number, bold = false) {
  const avg = fontSize * (bold ? 0.55 : 0.5);
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * avg > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export class SimplePdf {
  private pages: string[][] = [[]];
  private active = 0;

  private get current() {
    return this.pages[this.active];
  }

  addPage() {
    this.pages.push([]);
    this.active = this.pages.length - 1;
  }

  pageCount() {
    return this.pages.length;
  }

  usePage(index: number) {
    this.active = index;
  }

  fillPage(r: number, g: number, b: number) {
    this.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: { r, g, b } });
  }

  text(
    value: string,
    x: number,
    yFromTop: number,
    opts: {
      size: number;
      bold?: boolean;
      r?: number;
      g?: number;
      b?: number;
      align?: "left" | "right" | "center";
    },
  ) {
    const size = opts.size;
    const y = PAGE_HEIGHT - yFromTop;
    const fill = color(opts.r ?? 26, opts.g ?? 36, opts.b ?? 32);
    const font = opts.bold ? "F2" : "F1";
    const width = measurePdfText(value, size, Boolean(opts.bold));
    let drawX = x;
    if (opts.align === "right") drawX = x - width;
    if (opts.align === "center") drawX = x - width / 2;
    this.current.push(
      [
        `${fill} rg`,
        "BT",
        `/${font} ${size} Tf`,
        `1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm`,
        `(${pdfEscape(value)}) Tj`,
        "ET",
      ].join("\n"),
    );
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { r?: number; g?: number; b?: number; width?: number },
  ) {
    const stroke = color(opts?.r ?? 30, opts?.g ?? 122, opts?.b ?? 110);
    this.current.push(
      [
        `${stroke} RG`,
        `${opts?.width ?? 1} w`,
        `${x1.toFixed(2)} ${(PAGE_HEIGHT - y1).toFixed(2)} m`,
        `${x2.toFixed(2)} ${(PAGE_HEIGHT - y2).toFixed(2)} l`,
        "S",
      ].join("\n"),
    );
  }

  rect(
    x: number,
    yFromTop: number,
    width: number,
    height: number,
    opts?: {
      fill?: { r: number; g: number; b: number };
      stroke?: { r: number; g: number; b: number; width?: number };
    },
  ) {
    const top = PAGE_HEIGHT - yFromTop;
    const bottom = top - height;
    const commands: string[] = [];
    if (opts?.fill) {
      commands.push(`${color(opts.fill.r, opts.fill.g, opts.fill.b)} rg`);
    }
    if (opts?.stroke) {
      commands.push(`${color(opts.stroke.r, opts.stroke.g, opts.stroke.b)} RG`);
      commands.push(`${opts.stroke.width ?? 1} w`);
    }
    commands.push(`${x.toFixed(2)} ${bottom.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);
    if (opts?.fill && opts?.stroke) commands.push("B");
    else if (opts?.fill) commands.push("f");
    else commands.push("S");
    this.current.push(commands.join("\n"));
  }

  download(filename: string) {
    const blob = new Blob([this.build()], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private build() {
    const objects: string[] = [];
    const pageCount = this.pages.length;
    const fontRegular = 3 + pageCount * 2;
    const fontBold = fontRegular + 1;
    const pageIds = this.pages.map((_, i) => 3 + i * 2);

    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);

    this.pages.forEach((commands, i) => {
      const pageId = 3 + i * 2;
      const contentId = pageId + 1;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`,
      );
      const stream = `${commands.join("\n")}\n`;
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    });

    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    let output = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(output.length);
      output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefStart = output.length;
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1) {
      output += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    output += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return output;
  }
}

export const PDF_PAGE = {
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
};

/** Brand palette for print: cream paper, dark ink, teal and sage accents. */
export const PDF_THEME = {
  cream: { r: 250, g: 249, b: 245 },
  creamSoft: { r: 244, g: 241, b: 234 },
  ink: { r: 26, g: 36, b: 32 },
  muted: { r: 90, g: 110, b: 104 },
  teal: { r: 30, g: 122, b: 110 },
  tealMid: { r: 42, g: 157, b: 143 },
  sage: { r: 127, g: 173, b: 139 },
  sageSoft: { r: 232, g: 242, b: 236 },
  tealSoft: { r: 230, g: 244, b: 241 },
  line: { r: 196, g: 214, b: 208 },
  white: { r: 255, g: 255, b: 255 },
};
