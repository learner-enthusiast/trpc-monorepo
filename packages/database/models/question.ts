import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const questionTypeEnum = pgEnum("question_type", [
  "SHORT_TEXT",
  "LONG_TEXT",
  "MULTIPLE_CHOICE",
  "CHECKBOX",
  "DROPDOWN",
  "RATING",
  "SCALE",
  "YES_NO",
  "EMAIL",
  "PHONE",
  "DATE",
  "FILE_UPLOAD",
  "STATEMENT",
]);

export const questionsTable = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),

  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),

  order: integer("order").notNull(),
  type: questionTypeEnum("type").notNull(),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),

  required: boolean("required").notNull().default(false),

  settings: jsonb("settings"),
});

export type SelectQuestion = typeof questionsTable.$inferSelect;
export type InsertQuestion = typeof questionsTable.$inferInsert;
