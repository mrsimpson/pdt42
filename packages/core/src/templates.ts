import {
  canvasById,
  enrichesElsewhere,
  homeStep,
  STEPS,
  stepById,
  type StepInfo,
} from "./methodology.ts";
import { blockFields, blockMeta, type BlockType } from "./schemas.ts";

// What `pdt42 guide step <id>` hands to an author: the step's dependencies, derived from the
// reference fields of its block types, and a starter template. Like arc42's chapter templates,
// guidance and examples sit inside an HTML comment — the parser skips comments, so copying the
// template never adds model elements by accident.

export interface StepDependency {
  /** The block type this step's blocks reference. */
  type: BlockType;
  /** The type's home step: the step that creates it, whose chapter holds its blocks. */
  step: string;
  /** The referencing fields, as `type.field`. */
  via: string[];
  /** At least one of the referencing fields is required. */
  required: boolean;
}

/** Types introduced in other steps that this step's blocks may or must reference. */
export function stepDependencies(step: StepInfo): StepDependency[] {
  const own = new Set<BlockType>([...step.blocks, ...(step.enriches ?? []).map((e) => e.type)]);
  const deps = new Map<BlockType, StepDependency>();
  for (const type of own) {
    for (const field of blockFields(type)) {
      if (!field.target) continue;
      for (const target of field.target as BlockType[]) {
        if (step.blocks.includes(target)) continue;
        const dep = deps.get(target) ?? {
          type: target,
          step: homeStep(target).id,
          via: [],
          required: false,
        };
        dep.via.push(`${type}.${field.name}`);
        dep.required ||= field.required;
        deps.set(target, dep);
      }
    }
  }
  const order = (id: string) => STEPS.findIndex((s) => s.id === id);
  return [...deps.values()].sort(
    (a, b) => order(a.step) - order(b.step) || a.type.localeCompare(b.type),
  );
}

/**
 * The type's example as a section. With `fields`, only those attributes (and id, title) stay:
 * what one step writes — E2 an entity's layer, D1 its role and clusters.
 */
function exampleSection(type: BlockType, fields?: string[]): string {
  const meta = blockMeta(type);
  const title = /(?:^|\n)title: (.*)/.exec(meta.example)?.[1] ?? type;
  let keep = true;
  const example = fields
    ? meta.example
        .split("\n")
        .filter((line) => {
          if (!line.startsWith(" "))
            keep = ["id", "title", ...fields].includes(line.split(":")[0]!);
          return keep;
        })
        .join("\n")
    : meta.example;
  return `## ${title}\n\nOne or two sentences on why this element matters.\n\n\`\`\`pdt42\n:::${type}\n${example}\n:::\n\`\`\`\n`;
}

/** The fields a step fills on one of its own types, if it names them (E2: an entity's layer). */
const ownFields = (step: StepInfo, type: BlockType) =>
  step.enriches?.find((e) => e.type === type)?.fields;

/**
 * For each type a step fills in but does not create: where its blocks live, and that a new one
 * found in this step is written there too.
 */
function homeNotes(step: StepInfo): { lines: string[]; examples: string } {
  const elsewhere = enrichesElsewhere(step);
  const lines = elsewhere.map(({ type, fields }) => {
    const home = homeStep(type);
    const here = home.file === step.file ? "" : ", not in this chapter";
    return `Add ${fields.join(", ")} to the existing :::${type} blocks in their home chapter, ${home.file} (${home.id}). A new ${type} you find in this step is written there too${here}.`;
  });
  const examples = elsewhere
    .map(
      ({ type, fields }) =>
        `In ${homeStep(type).file}, an existing :::${type} with what ${step.id} adds:\n\n${exampleSection(type, fields)}`,
    )
    .join("\n");
  return { lines, examples };
}

/** The `:::canvas` block a step's chapter shows, as template text. */
export function canvasSnippet(step: StepInfo): string {
  const canvas = step.canvas ? canvasById(step.canvas) : undefined;
  if (!canvas) return "";
  const of = canvas.per ? `of: <${canvas.per} id>\n` : "";
  const where = canvas.per
    ? `Place one ${canvas.title} per ${canvas.per === "entity" ? "peer role" : canvas.per}, next to it:`
    : `Place the ${canvas.title} under the chapter title:`;
  return `${where}\n\n\`\`\`pdt42\n:::canvas\nid: cv-${canvas.id}\ncanvas: ${canvas.id}\n${of}:::\n\`\`\`\n\nThe canvas is drawn from the model; every element on it links to its section.\n`;
}

/** Starter content for one step. */
export function starterTemplate(stepId: string): string {
  const step = stepById(stepId);
  if (!step) throw new Error(`Unknown step "${stepId}"`);
  const firstInFile = STEPS.find((s) => s.file === step.file) === step;
  const guidance = [
    `${step.id} · ${step.title}`,
    step.question,
    "",
    ...step.how.map((h) => `- ${h}`),
  ];

  const home = homeNotes(step);
  if (!step.blocks.length) {
    // Enrich-only steps (D2 portraits, E4 focus) add fields to blocks written earlier.
    const canvas = canvasSnippet(step);
    return `<!--\n${[...guidance, "", ...home.lines].join("\n")}\n\nExample:\n\n${home.examples}${canvas ? `\n${canvas}` : ""}-->\n`;
  }

  const heading = firstInFile ? `# ${step.title}\n\n` : "";
  const examples = step.blocks
    .map((type) => exampleSection(type, ownFields(step, type)))
    .join("\n");
  const canvas = canvasSnippet(step);
  const notes = home.lines.length ? `\n\n${home.lines.join("\n")}` : "";
  const enriched = home.examples ? `\n${home.examples}` : "";
  return `${heading}<!--\n${guidance.join("\n")}${notes}\n\n${canvas ? `${canvas}\n` : ""}One section per element: a heading, prose, then the block. Examples:\n\n${examples}${enriched}-->\n`;
}
