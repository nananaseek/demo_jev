import { expect, test } from "@playwright/test";

test("catalog searches doctors and filters by category tags", async ({ page }) => {
  await page.goto("/doctors");

  await expect(page.getByRole("heading", { name: "Знайдіть свого лікаря" })).toBeVisible();
  await expect(page.getByText(/159 вигаданих профілів/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Про JEV" })).toHaveCount(0);

  await page.getByLabel("Пошук лікарів").fill("Хоменко");
  await expect(page.getByRole("heading", { name: "Тетяна Хоменко" })).toBeVisible();

  await page.getByRole("button", { name: "Скинути" }).click();
  await page.getByRole("button", { name: /Психічне здоров'я/ }).click();
  await page.getByRole("button", { name: "тривога", exact: true }).click();

  await expect(page.getByLabel("Пошук лікарів")).toHaveValue("тривога");
  await expect(page.getByText(/Знайдено [1-9]\d* лікар/)).toBeVisible();
});

test("creates a local doctor, persists it and edits the price", async ({ page }) => {
  await page.goto("/doctors/editor");

  await page.getByLabel("Ім'я та прізвище").fill("Тестовий Лікар");
  await page.getByLabel("Підкатегорія").selectOption("psychotherapist");
  await page.getByLabel("Роль у каталозі").fill("Психотерапевт");
  await page.getByRole("button", { name: "Створити лікаря" }).click();
  await expect(page.getByRole("status")).toContainText("Лікаря створено локально");

  await page.goto("/doctors");
  await page.getByLabel("Пошук лікарів").fill("Тестовий Лікар");
  await expect(page.getByRole("heading", { name: "Тестовий Лікар" })).toBeVisible();

  await page.reload();
  await page.getByLabel("Пошук лікарів").fill("Тестовий Лікар");
  await expect(page.getByRole("heading", { name: "Тестовий Лікар" })).toBeVisible();

  await page.getByRole("link", { name: "Редагувати профіль Тестовий Лікар" }).click();
  await expect(page.getByLabel("Ціна, ₴")).toHaveValue("1200");
  await page.getByLabel("Ціна, ₴").fill("2222");
  await page.getByRole("button", { name: "Зберегти зміни" }).click();
  await expect(page.getByRole("status")).toContainText("Зміни збережено");

  await page.reload();
  await expect(page.getByLabel("Ціна, ₴")).toHaveValue("2222");
});
