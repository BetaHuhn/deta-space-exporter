// deno-lint-ignore-file no-explicit-any

import { fetchFn } from "deta-space-client";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";

export const fetchFromSpace = fetchFn(Deno.env.get("DETA_ACCESS_TOKEN") ?? '');

export type Options = { output: string, unzip: boolean, listRequiresScope: boolean }

export async function fetchAPI(path: string, method: string = 'GET', payload?: any) {
    try {

        const response = await fetchFromSpace(path, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            ...(payload && { body: JSON.stringify(payload) })
        });

        // Handle rate limit error
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1');
            console.log(`Rate limited. Retrying after ${retryAfter} seconds`);
            await wait(retryAfter * 1000);
            return fetchAPI(path, method, payload);
        }
        
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch from Space');
    }
}

// remove whitespace and special characters from name
export function cleanName(name: string) {
    return name.replace(/[^a-zA-Z0-9]/g, '');
}

export function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class SnapshotDownloader {
    scope: string;
    options: Options;

    constructor(scope: string, options?: Partial<Options>) {
        this.scope = scope;

        const defaultOptions: Options = {
            output: './exports',
            unzip: true,
            listRequiresScope: true
        }

        this.options = Object.assign(defaultOptions, options);
    }

    abstract itemToName(item: any): string;

    private async getItems() {
        const res = await fetchAPI(`/${this.scope}?per_page=1000`);
        if (this.options.listRequiresScope) {
            return res[this.scope];
        }

        return res;
    }

    private createSnapshot(id: string) {
        return fetchAPI(`/${this.scope}/${id}/snapshots`, 'POST');
    }

    private async getSnapshot(id: string) {
        const res = await fetchAPI(`/${this.scope}/${id}/snapshots?per_page=100`);
        return res.snapshots[0];
    }

    private async unzipSnapshot(snapshotPath: string, destination: string) {
        const snapshotZip = await decompress(snapshotPath, destination);
        return snapshotZip;
    }
    
    private async downloadSnapshot(snapshotUrl: string, destination: string) {
        const response = await fetch(snapshotUrl);
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to get reader from response body');
        }
    
        // Ensure the destination folder exists
        const destinationFolder = destination.substring(0, destination.lastIndexOf('/'));
        await Deno.mkdir(destinationFolder, { recursive: true });
    
        const writer = await Deno.open(destination, { write: true, create: true });
        const stream = new ReadableStream({
            async pull(controller) {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            }
        });
    
        await stream.pipeTo(writer.writable);

        if (!this.options.unzip) {
            return destination;
        }
    
        // Unzip the snapshot
        const res = await this.unzipSnapshot(destination, destination.replace('.zip', ''));
        if (res) {
            // Delete zip
            console.log('Deleting zip file', destination);
            await Deno.remove(destination);
        }
    
        return destination;
    }
    

    async createSnapshots() {
        const items = await this.getItems();
        console.log(items);

        for (const item of items) {
            const snapshot = await this.createSnapshot(item.id);
            console.log(snapshot);

            await wait(200);
        }
    }

    async downloadSnapshots() {
        const items = await this.getItems();
        console.log(items);

        for (const item of items) {
            const snapshot = await this.getSnapshot(item.id);
            console.log(snapshot);

            if (snapshot.status !== 'complete') {
                console.log('Snapshot is not ready yet', snapshot.id);
                continue;
            }

            const snapshotPath = await this.downloadSnapshot(snapshot.file_path, `${this.options.output}/${this.scope}/${this.itemToName(item)}-${snapshot.id}.zip`);
            console.log(snapshotPath);
        }
    }
}
