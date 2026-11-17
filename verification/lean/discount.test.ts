import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';

type DiscountCase = {
  subtotal: number;
  discount: number;
  expected: number;
};

function netAmount(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

const cases = JSON.parse(
  readFileSync(new URL('./cases.json', import.meta.url), 'utf8'),
) as DiscountCase[];
assert.ok(cases.length > 0, 'Provide at least one discount case');

for (const { subtotal, discount, expected } of cases) {
  test(`net amount for subtotal ${subtotal} and discount ${discount}`, () => {
    for (const amount of [subtotal, discount, expected]) {
      assert.ok(Number.isSafeInteger(amount) && amount >= 0);
    }
    assert.equal(netAmount(subtotal, discount), expected);
  });
}
