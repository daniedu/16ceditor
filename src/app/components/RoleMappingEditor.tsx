"use client";

import { RoleMapping, DEFAULT_ROLE_MAPPING, ROLE_GROUPS, ROLE_LABELS } from "@/src/lib/types";
import { BASE_KEYS } from "@/src/lib/presets";
import { RotateCcw } from "lucide-react";

export default function RoleMappingEditor({
  mapping,
  onChange,
}: {
  mapping: RoleMapping;
  onChange: (m: RoleMapping) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold tracking-wider text-outline">ROLE MAPPING</div>
        <button
          onClick={() => onChange(DEFAULT_ROLE_MAPPING)}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] border"
          style={{ borderColor: "#353535", color: "#93927b" }}
          title="Reset to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="space-y-2">
        {ROLE_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[12px] font-semibold text-[#93927b] mb-1">{group.label}</div>
            <div className="space-y-0.5">
              {group.roles.map((role) => (
                <div key={role} className="flex items-center gap-2 text-[13px]">
                  <span className="text-[#e4e2e1] w-16 shrink-0">{ROLE_LABELS[role]}</span>
                  <select
                    value={mapping[role]}
                    onChange={(e) => onChange({ ...mapping, [role]: e.target.value as any })}
                    className="flex-1 bg-[#1b1c1c] text-[#e4e2e1] px-1 py-0.5 border border-[#1f2020] outline-none text-[12px] font-mono"
                    style={{ borderColor: "#353535", background: "#1b1c1c", color: "#e4e2e1" }}
                  >
                    {BASE_KEYS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
