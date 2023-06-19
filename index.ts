import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Decimal } from "decimal.js";

export interface DecimalInput {
  isValid: boolean;
  input: string;
}

export function useDecimalInput(
  initial: string = "",
): [Decimal, DecimalInput, Dispatch<SetStateAction<string>>] {
  const [input, setInput] = useState(initial);
  return useMemo(() => {
    const { isValid, decimal } = decimalFromInput(input);
    return [decimal, { isValid, input }, setInput];
  }, [input, setInput]);
}

/**
 * Transform raw user input into a decimal.
 *
 * There are many inputs that are valid to humans but can't
 * be processed by `Decimal`. This method is useful for adding
 * some human-friendly leniency to the input parsing.
 *
 * You'd definitely expect commas to work in inputs, for example.
 */
function decimalFromInput(input: string): {
  isValid: boolean;
  decimal: Decimal;
} {
  const INVALID_DECIMAL = { isValid: false, decimal: new Decimal("0") };

  input = input.trim();

  if (input === "." || input.length === 0) {
    // A single decimal point is perfectly valid in my book!
    // We can interpret it as zero.
    return { isValid: true, decimal: new Decimal("0") };
  }

  if (input[0] === ",") {
    // Decimals can't contain leading commas.
    return INVALID_DECIMAL;
  }

  if (input.match(/[^0-9,\.]/)) {
    // First ensure only valid characters exist in the input.
    return INVALID_DECIMAL;
  }

  let digitsBetweenCommas = 0;
  let hasDecimal = false;
  let hasCommas = false;
  for (const c of input) {
    if (hasDecimal) {
      if (c === ",") {
        // Commas shouldn't appear after decimals.
        return INVALID_DECIMAL;
      }
      if (c === ".") {
        // Decimals cannot contain more than a single decimal point.
        return INVALID_DECIMAL;
      }
    } else {
      if (c === ".") {
        if (hasCommas && digitsBetweenCommas != 3) {
          // There must be 3 digits between commas and decimal points.
          return INVALID_DECIMAL;
        }
        hasDecimal = true;
      } else if (c === ",") {
        if (hasCommas) {
          if (digitsBetweenCommas != 3) {
            // There must be 3 digits between commas and decimal points.
            return INVALID_DECIMAL;
          }
        } else {
          if (digitsBetweenCommas > 3) {
            // There must be 3 digits between commas and decimal points.
            return INVALID_DECIMAL;
          }
          hasCommas = true;
        }
        digitsBetweenCommas = 0;
      } else {
        digitsBetweenCommas += 1;
      }

      if (hasCommas && digitsBetweenCommas > 3) {
        return INVALID_DECIMAL;
      }
    }
  }

  // Remove all commas because they can't be processed by `Decimal`.
  input = input.replace(/,/g, "");

  return { isValid: true, decimal: new Decimal(input) };
}
