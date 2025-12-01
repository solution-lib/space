// src/types.d.ts
//
// Template configuration types with 'ready' status



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface TemplateConfig {
        name            : TemplateVariant;
        label           : string;
        description     : string;
        repo            : string;
        deps?           : string[];
        requiresSetup   : boolean;
        ready           : boolean;  // NEW: indicates if template is implemented
    }

    export interface SpaceTypeConfig {
        type            : SpaceType;
        defaultTemplate : TemplateVariant;
        templates       : TemplateConfig[];
    }

    export type SpaceType       = 'lib' | 'cli' | 'server' | 'web';
    export type TemplateVariant = 'clean';


    export interface AppConfig {
        name            : string;
        version         : string;
        desc            : string;
    }

    export type PackageManager = 'bun' | 'npm';

    export interface SpaceConfig {
        type            : 'lib' | 'cli' | 'server';
        template        : TemplateVariant;
        pm              : 'bun' | 'npm';

        repo            : {
            org         : string;
            name        : string;
            version     : string;
            desc?       : string;
            kw?         : string[];
            license?    : string;
            issues?     : string;      // NEW
            homepage?   : string;      // NEW
            git_url?    : string;      // NEW
        };

        author          : {
            id?         : string;
            name?       : string;
            email?      : string;
            url?        : string;
        };

        createdAt       : string;
    }

    export interface InitCommandParams {
        args            : {
            name        : string;
        };
        options         : {
            type?       : string;
            desc?       : string;
            pm?         : string;
            template?   : string;
        };
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝