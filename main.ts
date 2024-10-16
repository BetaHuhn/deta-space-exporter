#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run
// deno-lint-ignore-file no-explicit-any

import "jsr:@std/dotenv/load";

import { parseArgs } from "jsr:@std/cli/parse-args";
import { cleanName, Options, SnapshotDownloader } from "./utils.ts";

export class HorizonDownloader extends SnapshotDownloader {
    constructor(options: Partial<Options> = {}) {
        super('horizons', { listRequiresScope: false, ...options });
    }

    itemToName(item: any) {
        return cleanName(item.name);
    }
}

export class InstanceDownloader extends SnapshotDownloader {
    constructor(options: Partial<Options> = {}) {
        super('instances', options);
    }

    itemToName(item: any) {
        return cleanName(item.alias);
    }
}

export class CollectionsDownloader extends SnapshotDownloader {
    constructor(options: Partial<Options> = {}) {
        super('collections', options);
    }

    itemToName(item: any) {
        return cleanName(item.name);
    }
}

async function run(scope: string, action: string, opts: Partial<Options>) {
    const downloaders: SnapshotDownloader[] = [];

    if (!scope || scope === 'horizons') {
        downloaders.push(new HorizonDownloader(opts));
    }
    
    if (!scope || scope === 'instances') {
        downloaders.push(new InstanceDownloader(opts));
    }

    if (!scope || scope === 'collections') {
        downloaders.push(new CollectionsDownloader(opts));
    }
    
    
    if (downloaders.length === 0) {
        throw new Error('Invalid scope, must be one of: horizons, instances, collections');
    }

    if (action === 'create') {
        for (const downloader of downloaders) {
            console.log(`Creating snapshots for ${downloader.scope}`);
            await downloader.createSnapshots();
        }
    } else if (action === 'download') {
        for (const downloader of downloaders) {
            console.log(`Downloading snapshots for ${downloader.scope}`);
            await downloader.downloadSnapshots();
        }
    } else {
        throw new Error('Missing or invalid action, must be one of: create, download');
    }
}


const action = Deno.args[0];
const scope = Deno.args[1];

const flags = parseArgs(Deno.args, {
    string: ["output"],
    boolean: ["unzip"],
    default: { output: './exports', unzip: true },
    negatable: ["unzip"],
});

run(scope, action, { output: flags.output, unzip: flags.unzip });
