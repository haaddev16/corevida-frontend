import { displayText } from "@/lib/text";
import { PDF_PAGE, PDF_THEME as T, SimplePdf, wrapPdfText } from "@/lib/pdf-doc";
import type { Plan } from "@/lib/types";

const MARGIN = 48;
const CONTENT_W = PDF_PAGE.width - MARGIN * 2;
const FOOTER_Y = PDF_PAGE.height - 36;
const CONTENT_BOTTOM = FOOTER_Y - 22;

function formatDate(value?: string | null) {
  if (!value) return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) {
    return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  return created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function downloadPlanPdf(plan: Plan) {
  const doc = new SimplePdf();
  let y = 0;
  const generated = formatDate(plan.created_at);

  const paintPageChrome = () => {
    doc.fillPage(T.cream.r, T.cream.g, T.cream.b);
    doc.rect(0, 0, PDF_PAGE.width, 8, { fill: T.teal });
  };

  const newPage = () => {
    doc.addPage();
    paintPageChrome();
    y = MARGIN + 12;
  };

  const ensure = (needed: number) => {
    if (y + needed <= CONTENT_BOTTOM) return;
    newPage();
  };

  const drawHeader = () => {
    paintPageChrome();
    y = MARGIN + 10;

    doc.rect(MARGIN, y, CONTENT_W, 78, {
      fill: T.white,
      stroke: { ...T.line, width: 0.8 },
    });
    doc.rect(MARGIN, y, 6, 78, { fill: T.teal });

    doc.text("COREVIDA", MARGIN + 22, y + 28, {
      size: 11,
      bold: true,
      r: T.teal.r,
      g: T.teal.g,
      b: T.teal.b,
    });
    doc.text("Your Wellness Plan", MARGIN + 22, y + 50, {
      size: 22,
      bold: true,
      r: T.ink.r,
      g: T.ink.g,
      b: T.ink.b,
    });
    doc.text(generated, MARGIN + CONTENT_W - 16, y + 30, {
      size: 9,
      align: "right",
      r: T.muted.r,
      g: T.muted.g,
      b: T.muted.b,
    });
    doc.text("Personalized nutrition, fitness, and habits", MARGIN + CONTENT_W - 16, y + 46, {
      size: 8.5,
      align: "right",
      r: T.sage.r,
      g: T.sage.g,
      b: T.sage.b,
    });

    y += 96;
  };

  const sectionTitle = (title: string) => {
    ensure(42);
    y += 10;
    doc.text(title.toUpperCase(), MARGIN, y, {
      size: 10,
      bold: true,
      r: T.teal.r,
      g: T.teal.g,
      b: T.teal.b,
    });
    y += 8;
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y, { ...T.tealMid, width: 1.4 });
    y += 16;
  };

  const paragraph = (
    text: string,
    opts?: { size?: number; bold?: boolean; color?: typeof T.ink; indent?: number; gap?: number },
  ) => {
    const size = opts?.size ?? 10.5;
    const indent = opts?.indent ?? 0;
    const gap = opts?.gap ?? size + 4;
    const color = opts?.color ?? T.ink;
    const lines = wrapPdfText(displayText(text), CONTENT_W - indent, size, opts?.bold);
    for (const line of lines) {
      ensure(gap);
      doc.text(line, MARGIN + indent, y, {
        size,
        bold: opts?.bold,
        r: color.r,
        g: color.g,
        b: color.b,
      });
      y += gap;
    }
  };

  const cardBlock = (height: number, accent = T.teal) => {
    ensure(height + 8);
    const top = y;
    doc.rect(MARGIN, top, CONTENT_W, height, {
      fill: T.white,
      stroke: { ...T.line, width: 0.7 },
    });
    doc.rect(MARGIN, top, 4, height, { fill: accent });
    return top;
  };

  drawHeader();

  // Summary
  sectionTitle("Summary");
  if (plan.final_plan.summary) {
    const lines = wrapPdfText(displayText(plan.final_plan.summary), CONTENT_W - 28, 11);
    const height = 24 + lines.length * 15;
    const top = cardBlock(height, T.teal);
    y = top + 18;
    for (const line of lines) {
      doc.text(line, MARGIN + 18, y, { size: 11, r: T.ink.r, g: T.ink.g, b: T.ink.b });
      y += 15;
    }
    y = top + height + 12;
  }

  const recs = plan.final_plan.key_recommendations.filter(Boolean);
  if (recs.length) {
    ensure(28);
    doc.text("Key recommendations", MARGIN, y, {
      size: 10.5,
      bold: true,
      r: T.ink.r,
      g: T.ink.g,
      b: T.ink.b,
    });
    y += 14;
    recs.forEach((rec, index) => {
      const text = `${index + 1}.  ${displayText(rec)}`;
      const lines = wrapPdfText(text, CONTENT_W - 18, 10);
      const blockH = 12 + lines.length * 13;
      ensure(blockH + 6);
      doc.rect(MARGIN, y, CONTENT_W, blockH, { fill: T.sageSoft });
      let ty = y + 12;
      for (const line of lines) {
        doc.text(line, MARGIN + 12, ty, { size: 10, r: T.ink.r, g: T.ink.g, b: T.ink.b });
        ty += 13;
      }
      y += blockH + 6;
    });
  }

  const highlights = [
    plan.final_plan.nutrition_highlights
      ? { label: "Nutrition", text: plan.final_plan.nutrition_highlights }
      : null,
    plan.final_plan.fitness_highlights
      ? { label: "Fitness", text: plan.final_plan.fitness_highlights }
      : null,
    plan.final_plan.habit_highlights ? { label: "Habits", text: plan.final_plan.habit_highlights } : null,
  ].filter(Boolean) as { label: string; text: string }[];

  if (highlights.length) {
    y += 4;
    highlights.forEach((item) => {
      const body = wrapPdfText(displayText(item.text), CONTENT_W - 110, 9.5);
      const h = Math.max(28, 14 + body.length * 12);
      ensure(h + 6);
      doc.rect(MARGIN, y, CONTENT_W, h, {
        fill: T.tealSoft,
        stroke: { ...T.line, width: 0.5 },
      });
      doc.text(item.label.toUpperCase(), MARGIN + 12, y + 16, {
        size: 8.5,
        bold: true,
        r: T.teal.r,
        g: T.teal.g,
        b: T.teal.b,
      });
      let ty = y + 16;
      for (const line of body) {
        doc.text(line, MARGIN + 96, ty, { size: 9.5, r: T.ink.r, g: T.ink.g, b: T.ink.b });
        ty += 12;
      }
      y += h + 6;
    });
  }

  // Nutrition
  sectionTitle("Nutrition");
  {
    const calories = plan.nutrition_plan.daily_calorie_target.toLocaleString();
    ensure(36);
    doc.rect(MARGIN, y, CONTENT_W, 30, { fill: T.teal });
    doc.text("Daily calorie target", MARGIN + 14, y + 19, {
      size: 10,
      bold: true,
      r: 255,
      g: 255,
      b: 255,
    });
    doc.text(`${calories} kcal`, MARGIN + CONTENT_W - 14, y + 19, {
      size: 12,
      bold: true,
      align: "right",
      r: 255,
      g: 255,
      b: 255,
    });
    y += 40;
  }

  // Meals table header
  ensure(26);
  doc.rect(MARGIN, y, CONTENT_W, 22, { fill: T.creamSoft });
  doc.line(MARGIN, y + 22, MARGIN + CONTENT_W, y + 22, { ...T.line, width: 0.8 });
  doc.text("Meal", MARGIN + 12, y + 15, { size: 9, bold: true, r: T.muted.r, g: T.muted.g, b: T.muted.b });
  doc.text("Details", MARGIN + 118, y + 15, {
    size: 9,
    bold: true,
    r: T.muted.r,
    g: T.muted.g,
    b: T.muted.b,
  });
  doc.text("kcal", MARGIN + CONTENT_W - 12, y + 15, {
    size: 9,
    bold: true,
    align: "right",
    r: T.muted.r,
    g: T.muted.g,
    b: T.muted.b,
  });
  y += 22;

  plan.nutrition_plan.meals.forEach((meal, index) => {
    const name = displayText(meal.name);
    const descLines = wrapPdfText(displayText(meal.description || " "), CONTENT_W - 170, 9.5);
    const rowH = Math.max(34, 16 + descLines.length * 12 + 8);
    ensure(rowH + 2);
    if (index % 2 === 0) {
      doc.rect(MARGIN, y, CONTENT_W, rowH, { fill: T.white });
    } else {
      doc.rect(MARGIN, y, CONTENT_W, rowH, { fill: T.sageSoft });
    }
    doc.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH, { ...T.line, width: 0.5 });
    doc.text(name, MARGIN + 12, y + 16, { size: 10, bold: true, r: T.ink.r, g: T.ink.g, b: T.ink.b });
    let ty = y + 16;
    for (const line of descLines) {
      doc.text(line, MARGIN + 118, ty, { size: 9.5, r: T.ink.r, g: T.ink.g, b: T.ink.b });
      ty += 12;
    }
    doc.text(String(meal.estimated_calories), MARGIN + CONTENT_W - 12, y + 16, {
      size: 10,
      bold: true,
      align: "right",
      r: T.teal.r,
      g: T.teal.g,
      b: T.teal.b,
    });
    y += rowH;
  });

  if (plan.nutrition_plan.notes) {
    y += 10;
    ensure(40);
    doc.text("Coach note", MARGIN, y, { size: 9.5, bold: true, r: T.teal.r, g: T.teal.g, b: T.teal.b });
    y += 13;
    paragraph(plan.nutrition_plan.notes, { size: 9.5, color: T.muted });
  }

  // Fitness
  sectionTitle("Fitness");
  plan.fitness_plan.weekly_schedule.forEach((day) => {
    const focus = day.focus ? displayText(day.focus) : "";
    const title = focus ? `${displayText(day.day)}  ·  ${focus}` : displayText(day.day);
    const exerciseLines = day.exercises.map((exercise) => {
      const sets =
        exercise.sets > 1
          ? `${exercise.sets} sets of ${displayText(exercise.reps)}`
          : displayText(exercise.reps);
      return {
        name: displayText(exercise.name),
        detail: sets,
      };
    });

    let bodyH = 0;
    exerciseLines.forEach((row) => {
      const nameLines = wrapPdfText(row.name, CONTENT_W - 180, 9.5);
      bodyH += Math.max(16, nameLines.length * 12) + 4;
    });
    const cardH = 36 + bodyH + 10;
    ensure(cardH + 8);

    const top = y;
    doc.rect(MARGIN, top, CONTENT_W, cardH, {
      fill: T.white,
      stroke: { ...T.line, width: 0.7 },
    });
    doc.rect(MARGIN, top, CONTENT_W, 24, { fill: T.tealSoft });
    doc.rect(MARGIN, top, 4, cardH, { fill: T.sage });
    doc.text(title, MARGIN + 14, top + 16, {
      size: 10,
      bold: true,
      r: T.teal.r,
      g: T.teal.g,
      b: T.teal.b,
    });

    let ty = top + 36;
    exerciseLines.forEach((row) => {
      const nameLines = wrapPdfText(row.name, CONTENT_W - 180, 9.5);
      const firstLineY = ty;
      for (const line of nameLines) {
        doc.text(line, MARGIN + 14, ty, { size: 9.5, r: T.ink.r, g: T.ink.g, b: T.ink.b });
        ty += 12;
      }
      doc.text(row.detail, MARGIN + CONTENT_W - 12, firstLineY, {
        size: 9,
        align: "right",
        r: T.muted.r,
        g: T.muted.g,
        b: T.muted.b,
      });
      ty += 4;
    });

    y = top + cardH + 10;
  });

  if (plan.fitness_plan.notes) {
    ensure(40);
    doc.text("Coach note", MARGIN, y, { size: 9.5, bold: true, r: T.teal.r, g: T.teal.g, b: T.teal.b });
    y += 13;
    paragraph(plan.fitness_plan.notes, { size: 9.5, color: T.muted });
  }

  // Habits
  sectionTitle("Habits");
  plan.habit_checklist.habits.forEach((habit, index) => {
    const name = displayText(habit.name);
    const meta = [habit.frequency, habit.reason].filter(Boolean).map((v) => displayText(v)).join("  ·  ");
    const nameLines = wrapPdfText(name, CONTENT_W - 40, 10.5, true);
    const metaLines = meta ? wrapPdfText(meta, CONTENT_W - 40, 9) : [];
    const h = 18 + nameLines.length * 13 + metaLines.length * 12;
    ensure(h + 6);
    doc.rect(MARGIN, y, CONTENT_W, h, {
      fill: index % 2 === 0 ? T.white : T.creamSoft,
      stroke: { ...T.line, width: 0.6 },
    });
    doc.rect(MARGIN + 10, y + 10, 8, 8, {
      stroke: { ...T.teal, width: 1.2 },
    });
    let ty = y + 17;
    for (const line of nameLines) {
      doc.text(line, MARGIN + 28, ty, { size: 10.5, bold: true, r: T.ink.r, g: T.ink.g, b: T.ink.b });
      ty += 13;
    }
    for (const line of metaLines) {
      doc.text(line, MARGIN + 28, ty, { size: 9, r: T.muted.r, g: T.muted.g, b: T.muted.b });
      ty += 12;
    }
    y += h + 6;
  });

  if (plan.habit_checklist.notes) {
    ensure(40);
    doc.text("Coach note", MARGIN, y, { size: 9.5, bold: true, r: T.teal.r, g: T.teal.g, b: T.teal.b });
    y += 13;
    paragraph(plan.habit_checklist.notes, { size: 9.5, color: T.muted });
  }

  // Closing band
  ensure(48);
  y += 8;
  doc.rect(MARGIN, y, CONTENT_W, 36, { fill: T.tealSoft });
  doc.text("Built with Corevida", MARGIN + 14, y + 22, {
    size: 10,
    bold: true,
    r: T.teal.r,
    g: T.teal.g,
    b: T.teal.b,
  });
  doc.text("Share the plan, keep the momentum.", MARGIN + CONTENT_W - 14, y + 22, {
    size: 9,
    align: "right",
    r: T.muted.r,
    g: T.muted.g,
    b: T.muted.b,
  });

  // Footers on every page
  const pages = doc.pageCount();
  for (let index = 0; index < pages; index += 1) {
    doc.usePage(index);
    doc.line(MARGIN, FOOTER_Y - 10, MARGIN + CONTENT_W, FOOTER_Y - 10, { ...T.line, width: 0.7 });
    doc.text("Corevida", MARGIN, FOOTER_Y, {
      size: 8.5,
      bold: true,
      r: T.teal.r,
      g: T.teal.g,
      b: T.teal.b,
    });
    doc.text(`Generated ${generated}`, PDF_PAGE.width / 2, FOOTER_Y, {
      size: 8.5,
      align: "center",
      r: T.muted.r,
      g: T.muted.g,
      b: T.muted.b,
    });
    doc.text(`Page ${index + 1} of ${pages}`, MARGIN + CONTENT_W, FOOTER_Y, {
      size: 8.5,
      align: "right",
      r: T.muted.r,
      g: T.muted.g,
      b: T.muted.b,
    });
  }

  const stamp = (plan.plan_id || "plan").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "plan";
  doc.download(`corevida-plan-${stamp}.pdf`);
}
