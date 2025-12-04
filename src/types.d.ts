// src/types.d.ts
//
// Template configuration types with 'ready' status

import type { ParsedCommand } from '@je-es/cli';

// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface TemplateConfig {
        name            : TemplateVariant;
        label           : string;
        description     : string;
        repo            : string;
        deps?           : string[];
        requiresSetup   : boolean;
        ready           : boolean;
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
            issues?     : string;
            homepage?   : string;
            git_url?    : string;
        };

        author          : {
            id?         : string;
            name?       : string;
            email?      : string;
            url?        : string;
        };

        createdAt       : string;
    }

    // Base interface that extends ParsedCommand
    export interface CommandParams extends ParsedCommand {
        args: ParsedCommand['args'];
        options: ParsedCommand['options'];
        dynamicArgs?: string[];
        dynamicOptions?: Record<string, string | boolean>;
    }

    export interface InitCommandParams extends CommandParams {
        args: ParsedCommand['args'] & {
            name?: string;  // Made optional
        };
        options: ParsedCommand['options'] & {
            type?: string;
            desc?: string;
            pm?: string;
            template?: string;
        };
    }

    export interface LintParams extends CommandParams {
        options: ParsedCommand['options'] & {
            fix?: boolean;
        };
    }

    export interface InstallParams extends CommandParams {
        args: ParsedCommand['args'] & {
            packages?: string;
        };
        options: ParsedCommand['options'] & {
            dev?: boolean;
            global?: boolean;
        };
    }

    export interface RemoveParams extends CommandParams {
        args: ParsedCommand['args'] & {
            packages?: string;  // Made optional
        };
        options: ParsedCommand['options'] & {
            global?: boolean;
        };
    }

    export interface UpdateParams extends CommandParams {
        args: ParsedCommand['args'] & {
            packages?: string;
        };
    }

    export interface LinkParams extends CommandParams {
        args: ParsedCommand['args'] & {
            package?: string;
        };
    }

    export interface ListParams extends CommandParams {
        options: ParsedCommand['options'] & {
            global?: boolean;
        };
    }

    export interface TestParams extends CommandParams {
        args: ParsedCommand['args'] & {
            path?: string;
        };
        options: ParsedCommand['options'] & {
            coverage?: boolean;
            'coverage-reporter'?: string;
            watch?: boolean;
            bail?: boolean;
            timeout?: string;
            'rerun-each'?: string;
            concurrent?: boolean;
            'test-name-pattern'?: string;
        };
    }

    export interface RunScriptParams extends CommandParams {
        args: ParsedCommand['args'] & {
            script?: string;  // Made optional
        };
        dynamicArgs?: string[];
        dynamicOptions?: Record<string, string | boolean>;
    }

    export interface StartParams extends CommandParams {
        dynamicArgs?: string[];
        dynamicOptions?: Record<string, string | boolean>;
    }

    export type PublishAccess = 'public' | 'restricted';

    export interface PublishParams extends CommandParams {
        options: ParsedCommand['options'] & {
            tag?: string;
            access?: PublishAccess;
        };
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝