import nx from "@nx/eslint-plugin";

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
                    ],
                    // Bounded-context ("scope") and layering ("type") tags are pre-declared
                    // here per the module build order, ahead of the libs that will carry them,
                    // so every future domain lib is constrained from the moment it's generated.
                    depConstraints: [
                        { sourceTag: "scope:app", onlyDependOnLibsWithTags: ["*"] },
                        { sourceTag: "scope:platform", onlyDependOnLibsWithTags: ["scope:platform"] },
                        { sourceTag: "scope:tenancy", onlyDependOnLibsWithTags: ["scope:tenancy", "scope:platform"] },
                        { sourceTag: "scope:iam", onlyDependOnLibsWithTags: ["scope:iam", "scope:platform"] },
                        { sourceTag: "scope:employee", onlyDependOnLibsWithTags: ["scope:employee", "scope:platform"] },
                        { sourceTag: "scope:payroll", onlyDependOnLibsWithTags: ["scope:payroll", "scope:platform"] },
                        { sourceTag: "scope:leave", onlyDependOnLibsWithTags: ["scope:leave", "scope:platform"] },
                        { sourceTag: "scope:attendance", onlyDependOnLibsWithTags: ["scope:attendance", "scope:platform"] },
                        { sourceTag: "scope:performance", onlyDependOnLibsWithTags: ["scope:performance", "scope:platform"] },
                        { sourceTag: "scope:recruitment", onlyDependOnLibsWithTags: ["scope:recruitment", "scope:platform"] },
                        { sourceTag: "scope:benefits", onlyDependOnLibsWithTags: ["scope:benefits", "scope:platform"] },
                        { sourceTag: "scope:reporting", onlyDependOnLibsWithTags: ["scope:reporting", "scope:platform"] },
                        { sourceTag: "scope:notifications", onlyDependOnLibsWithTags: ["scope:notifications", "scope:platform"] },
                        { sourceTag: "scope:billing", onlyDependOnLibsWithTags: ["scope:billing", "scope:platform"] },

                        { sourceTag: "type:app", onlyDependOnLibsWithTags: ["*"] },
                        { sourceTag: "type:e2e", onlyDependOnLibsWithTags: ["*"] },
                        { sourceTag: "type:feature", onlyDependOnLibsWithTags: ["type:feature", "type:data-access", "type:domain", "type:util"] },
                        { sourceTag: "type:data-access", onlyDependOnLibsWithTags: ["type:data-access", "type:domain", "type:util"] },
                        { sourceTag: "type:domain", onlyDependOnLibsWithTags: ["type:domain", "type:util"] },
                        { sourceTag: "type:util", onlyDependOnLibsWithTags: ["type:util"] }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    }
];
