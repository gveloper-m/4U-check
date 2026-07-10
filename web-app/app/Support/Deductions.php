<?php

namespace App\Support;

class Deductions
{
    /**
     * Map a positive deduction magnitude to a severity bucket. Kept in one
     * place so every producer stamps severity identically and no renderer
     * has to re-derive it.
     */
    public static function severityFor(int $points): string
    {
        return match (true) {
            $points >= 15 => 'critical',
            $points >= 8  => 'major',
            $points >= 4  => 'moderate',
            default       => 'minor',
        };
    }

    /**
     * Render a single deduction as display text, handling BOTH the legacy
     * string shape (old reports stored plain strings, amount baked in) and
     * the structured shape (new reports store objects). Used by every PHP
     * render surface (PDF blades, CSV, mail) so they never need to branch.
     */
    public static function text(string|array $deduction): string
    {
        if (\is_string($deduction)) {
            return $deduction;
        }

        $label  = $deduction['label'] ?? '';
        $points = $deduction['points'] ?? null;

        return $points !== null ? "{$label} (-{$points})" : $label;
    }
}
