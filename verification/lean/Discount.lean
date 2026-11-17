import Lean

open Lean

def netAmount (subtotal discount : Nat) : Nat := subtotal - discount

theorem netAmount_le_subtotal (subtotal discount : Nat) :
    netAmount subtotal discount ≤ subtotal :=
  Nat.sub_le _ _

theorem netAmount_eq_zero (subtotal discount : Nat) :
    netAmount subtotal discount = 0 ↔ subtotal ≤ discount :=
  Nat.sub_eq_zero_iff_le

theorem netAmount_antitone (subtotal smaller larger : Nat) (h : smaller ≤ larger) :
    netAmount subtotal larger ≤ netAmount subtotal smaller :=
  Nat.sub_le_sub_left h subtotal

structure DiscountCase where
  subtotal : Nat
  discount : Nat
  expected : Nat
  deriving FromJson

def main (args : List String) : IO Unit := do
  let [fixturePath] := args | throw (IO.userError "Usage: lean --run Discount.lean cases.json")
  let contents ← IO.FS.readFile fixturePath
  let parsed : Except String (Array DiscountCase) := Json.parse contents >>= fromJson?
  let cases ← IO.ofExcept parsed
  if cases.isEmpty then
    throw (IO.userError "Provide at least one discount case")
  for sample in cases do
    let actual := netAmount sample.subtotal sample.discount
    unless actual == sample.expected do
      throw (IO.userError s!"subtotal {sample.subtotal}, discount {sample.discount}: expected {sample.expected}, got {actual}")
  IO.println s!"Validated {cases.size} shared discount cases"
