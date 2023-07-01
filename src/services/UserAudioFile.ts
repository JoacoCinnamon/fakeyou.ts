import fs from 'node:fs';
import path from 'node:path';
import type { AudioFile } from '../interface/AudioFile.js';
import { apiUrl, googleStorageUrl } from '../util/constants.js';
import { log } from '../util/log.js';
import { request } from '../util/request.js';
import { userTtsListResponseSchema, type UserTtsSchema } from '../util/validation.js';
import { promisify } from 'node:util';
import { downloadWav } from '../util/downloadWav.js';
import Model from './Model.js';

const writeFile = promisify(fs.writeFile);

export default class UserAudioFile implements AudioFile {
	constructor(data: UserTtsSchema) {
		this.ttsResultToken = data.tts_result_token;
		this.ttsModelToken = data.tts_model_token;
		this.ttsModelTitle = data.tts_model_title;
		this.rawInferenceText = data.raw_inference_text;
		this.publicBucketWavAudioPath = data.public_bucket_wav_audio_path;
		this.creatorUserToken = data.maybe_creator_user_token;
		this.creatorUsername = data.maybe_creator_username;
		this.creatorDisplayName = data.maybe_creator_display_name;
		this.creatorResultId = data.maybe_creator_result_id;
		this.fileSizeBytes = data.file_size_bytes;
		this.durationMillis = data.duration_millis;
		this.visibility = data.visibility;
		this.createdAt = data.created_at;
		this.updatedAt = data.updated_at;
		this.url = new URL(`${googleStorageUrl}${data.public_bucket_wav_audio_path}`);
	}

	readonly ttsResultToken: string;

	readonly ttsModelToken: string;

	readonly ttsModelTitle: string;

	readonly rawInferenceText: string;

	readonly publicBucketWavAudioPath: string;

	readonly creatorUserToken: string;

	readonly creatorUsername: string;

	readonly creatorDisplayName: string;

	readonly creatorResultId: number;

	readonly fileSizeBytes: number;

	readonly durationMillis: number;

	readonly visibility: string;

	readonly createdAt: Date;

	readonly updatedAt: Date;

	readonly url: URL;

	#buffer?: Buffer;

	static async fetchUserAudioFiles(
		username: string,
		cursor?: string
	): Promise<{
		cursorNext: string | null;
		cursorPrev: string | null;
		results: UserAudioFile[];
	} | null> {
		const url = new URL(`${apiUrl}/user/${username}/tts_results?limit=10`);

		if (cursor) {
			url.searchParams.append('cursor', cursor);
		}

		try {
			const response = await request(url, {
				method: 'GET'
			});

			const json = userTtsListResponseSchema.parse(await response.json());
			const results = json.results.map((userTtsAudioEntry) => new this(userTtsAudioEntry));

			return {
				cursorNext: json.cursor_next,
				cursorPrev: json.cursor_previous,
				results
			};
		} catch (error) {
			log.error(`Response from API failed validation. Could not load user TTS results.\n${error}`);

			return null;
		}
	}

	async toBuffer(): Promise<Buffer | null> {
		if (this.#buffer) {
			return this.#buffer;
		}

		const download = await downloadWav(this.url);

		if (download) {
			this.#buffer = download;

			return this.#buffer;
		}

		return null;
	}

	async toBase64(): Promise<string | null> {
		const buffer = await this.toBuffer();

		return buffer ? Buffer.from(buffer).toString('base64') : null;
	}

	async toDisk(location: `${string}.wav`): Promise<void> {
		const buffer = await this.toBuffer();

		if (buffer) {
			return writeFile(path.resolve(location), buffer);
		}
	}

	fetchTtsModel(): Promise<Model | null> {
		return Model.fetchModelByToken(this.ttsModelToken);
	}
}
