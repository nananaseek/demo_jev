import { expect, test, type Page } from "@playwright/test";

const PANIC = "Панічні атаки ввечері, важко дихати, триває два тижні";

async function submitComplaint(page: Page, complaint: string) {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Що вас турбує?" }).fill(complaint);
  await page.getByRole("button", { name: "Підібрати фахівця" }).click();
  await expect(page.getByRole("heading", { name: "Кому варто звернутися" })).toBeVisible();
}

test("selects category, subcategory and doctors, then reveals more", async ({ page }) => {
  await submitComplaint(page, PANIC);

  const console = page.locator("#how");
  await expect(console.getByText("Психічне здоров'я", { exact: true }).first()).toBeVisible();
  await expect(console.getByText("Психотерапевт", { exact: true }).first()).toBeVisible();
  await expect(console.getByText("97%")).toBeVisible();

  const showMore = page.getByRole("button", { name: /Показати ще \d+ профіл/ });
  await expect(showMore).toBeVisible();
  await showMore.click();
  await expect(showMore).toHaveCount(0);
});

test("shows the emergency banner for chest pain", async ({ page }) => {
  await submitComplaint(page, "Біль у грудях і задишка, тисне вже годину");

  const alert = page.locator("#how").getByRole("alert");
  await expect(alert).toContainText("103");
  await expect(alert).toContainText("невідкладна допомога");
});

test("resets the whole flow", async ({ page }) => {
  await submitComplaint(page, PANIC);

  await page.getByRole("button", { name: "Підібрати ще раз" }).click();
  await expect(page.getByRole("heading", { name: "Кому варто звернутися" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Що вас турбує?" })).toHaveValue("");
  await expect(page.getByText("Як JEV ухвалює рішення")).toBeVisible();
});

test("scrolls the decision console under the header on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await submitComplaint(page, PANIC);
  await page.waitForTimeout(600);

  const top = await page.locator("#how").evaluate((node) => node.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(64);
  expect(top).toBeLessThan(160);
});
