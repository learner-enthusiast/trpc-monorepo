import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { formResponsesTable } from "./formresponse";
import { questionsTable } from "./question";

export const answersTable = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),

  responseId: uuid("response_id")
    .notNull()
    .references(() => formResponsesTable.id, { onDelete: "cascade" }),

  questionId: uuid("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),

  value: jsonb("value").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SelectAnswer = typeof answersTable.$inferSelect;
export type InsertAnswer = typeof answersTable.$inferInsert;
