# Deta Space Data Exporter

Simple Deno script that can export your data (Horizons, Instances, Collections) from [Deta Space](https://deta.space).

## Setup

Make sure you have [Deno](https://deno.com) installed (see [Deno Docs](https://docs.deno.com/runtime/) for instructions).

Clone this repository:

```sh
git clone https://github.com/BetaHuhn/deta-space-exporter
```

Navigate into the repository:

```sh
cd deta-space-exporter
```

### Authentication

To use the script you need to provide your [Deta Space Access Token](https://deta.space/docs/en/build/fundamentals/space-cli#authentication). You can either provide it as an environment variable:

```sh
DETA_ACCESS_TOKEN=<your-access-token> ./deta-space-exporter
```

or create a `.env` file in the root of the repository with the following content:

```sh
DETA_ACCESS_TOKEN=<your-access-token>
```

## Usage

You can either run the compiled binary:
    
```sh
./deta-space-exporter
```

or run it via the Deno `run` command:

```sh
deno run --allow-net --allow-read --allow-write --allow-env --allow-run main.ts
```

To export your data you need to first create snapshots and then download them. This is two separate steps as creating snapshots might take some additional time.

### Creating Snapshots

To create snapshots you can use the `create` command and optionally provide a scope:

```sh
./deta-space-exporter create <scope>
```

Available scopes:
- `horizons`
- `instances`
- `collections`

If no scope is provided snapshots will be created for all three.

### Download Snapshots

To download snapshots you can use the `download` command and optionally provide a scope:

```sh
./deta-space-exporter download <scope>
```

Available scopes:
- `horizons`
- `instances`
- `collections`

If no scope is provided snapshots will be downloaded for all three.

#### Options

- `--output=<path>` - The path where the snapshots should be saved (default: `./exports`)
- `--unzip=<boolean>` - Unzip the snapshots after downloading (default: `true`)

The snapshots will be saved in the `./exports` folder by default. You can change this by providing the `--output` argument with a path:

```sh
./deta-space-exporter download --output <path>
```

By default the script will unzip the snapshots. You can disable this by providing the `--no-unzip` argument:

```sh
./deta-space-exporter download --no-unzip
```


## Examples

### Create and Download Snapshots for all data

Create snapshots for all data:

```sh
./deta-space-exporter create
```

Download snapshots for all data:

```sh
./deta-space-exporter download
```

### Create and Download Snapshots for a specific scope

Create snapshots your Collections:

```sh
./deta-space-exporter create collections
```

Download snapshots for your Collections:

```sh
./deta-space-exporter download collections
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
