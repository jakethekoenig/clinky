import { describe, expect, it } from "bun:test";
import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";

import { readCard } from "../../src/cards";
import { getHomeDir } from "../../src/config";

describe("card parsing", () => {
  it("ignores comment lines and splits front/back", () => {
    const tmp = mkdtempSync("/tmp/clinky-test-");
    process.env.CLINKY_HOME = tmp;
    const path = join(tmp, "cards", "test.txt");
    Bun.mkdirSync(join(tmp, "cards"), { recursive: true });
    const content = `Front line 1
%comment
Front line 2
<!---split--->
Back line
% comment`;
    writeFileSync(path, content, "utf8");
    const card = readCard(path);
    expect(card.front).toBe("Front line 1\nFront line 2");
    expect(card.back).toBe("Back line");
    expect(card.name).toBe("test.txt");
    expect(card.path).toBe(path);
    // reset
    delete process.env.CLINKY_HOME;
  });
});
