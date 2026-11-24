import { expect, test } from "@playwright/test";

const FAKE_RECOGNITION = () => {
  class FakeSpeechRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onstart: (() => void) | null = null;
    onresult: ((event: unknown) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    onend: (() => void) | null = null;

    start() {
      this.onstart?.();
      window.setTimeout(() => {
        const result = [{ transcript: "Болить коліно після бігу" }] as unknown as {
          isFinal: boolean;
          length: number;
          0: { transcript: string };
        };
        result.isFinal = true;
        this.onresult?.({ resultIndex: 0, results: [result] });
        this.onend?.();
      }, 40);
    }

    stop() {
      this.onend?.();
    }

    abort() {
      // no-op for the fake
    }
  }

  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeSpeechRecognition;
};

test("voice dictation fills an empty complaint", async ({ page }) => {
  await page.addInitScript(FAKE_RECOGNITION);
  await page.goto("/");

  await page.getByRole("button", { name: "Надиктувати скаргу голосом" }).click();

  await expect(page.getByRole("textbox", { name: "Що вас турбує?" })).toHaveValue(
    "Болить коліно після бігу",
  );
  await expect(page.getByRole("button", { name: "Надиктувати скаргу голосом" })).toBeVisible();
});

test("voice dictation appends to the existing complaint", async ({ page }) => {
  await page.addInitScript(FAKE_RECOGNITION);
  await page.goto("/");

  const field = page.getByRole("textbox", { name: "Що вас турбує?" });
  await field.fill("Панічні атаки ввечері");
  await page.getByRole("button", { name: "Надиктувати скаргу голосом" }).click();

  await expect(field).toHaveValue("Панічні атаки ввечері Болить коліно після бігу");
});
