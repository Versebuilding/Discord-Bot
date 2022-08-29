import { EmbedField, MessageEmbedOptions } from 'discord.js';
import fetch from 'node-fetch';
import { Authors, IconLinks } from '../VerseMacros';
import { msToTime } from '../util';

function ToURLParams(obj: { [key: string]: string | number | boolean }): string
{
	return Object.entries(obj)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&');
}

/**
 * Verse API. Contains all apis for the Verse bot.
 * @export
 */
export namespace VAPI
{
	export namespace Spotify
	{
		const token = "BQBF-2WyCPU4LCztyYVZkujr8L-lImlKbRQ9RIGTBr2iFLcJs0tpkLHBkSX8QwxgOuTL7c9z5qNTO9K33mi-FoN_IzmGZPVPMGR9SJBVo8P_AFtOjzbtn6fKCqJBOBPEMHWF4tyT0bXT3Accy5inxpwJ1JhwJg5fEdtF2V-OwBemuS2nnO7XWlhgAcpsfgY - 3hXOO45y433beuMRgjjdaUJqpbNSdjjV5tCcXsWurjTeLZfaXpiymcNfbogqbs6MiTSAAsgDBRI_glhP5IxA-Gir6YY44";

		export function CreateTrackEmbed(track: Track): MessageEmbedOptions
		{
			return {
				author: {
					name: "Spotify",
					url: `https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/1982px-Spotify_icon.svg.png`,
				},
				title: `${track.name}`,
				description: [
					["Artist", `${track.artists.map(a => a.name).join(', ')}`],
					["Album", `${track.album.name}`],
					["Duration", `${track.durationMS / 1000} seconds`],
					["Explicit", `${track.explicit ? "Yes" : "No"}`],
					["Popularity", `${track.popularity}`],
					["Release Date", `${track.album.releaseDate}`],
					["Track Number", `${track.trackNumber}`],
				].map(([key, value]) => `**${key}**: ${value}`).join('\n'),
				thumbnail: { url: track.album.images[0].url },
				color: 0x1db954,
			}
		}

		export function CreateTrackField(track: Track): EmbedField
		{
			return {
				name: `${track.album.name} - ${track.name}`,
				value: `${track.artists.map(a => a.name).join(', ')}, [Listen on Spotify](${track.externalUrls.spotify})`,
				inline: false,
			}
		}

		export function Search(query: string, type: string = "track"): Promise<SearchResponse>
		{
			if (query.length < 3 || query.length > 100) throw new Error("Query must be between 3 and 100 characters.");
			if (type != "track" && type != "artist" && type != "album") throw new Error("Invalid type.");

			const url = 'https://api.spotify.com/v1/search?' + ToURLParams({
				'q': query,
				'type': type,
				'market': 'ES',
				'limit': '3',
				'offset': '5'
			});
			return fetch(url, {
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token,
				}
			}).then(res => res.json()).then(json => json as SearchResponse);
		}

		export interface SearchResponse
		{
			tracks: Tracks;
		}
	
		export interface Tracks
		{
			href: string;
			items: Track[];
			limit: number;
			next: string;
			offset: number;
			previous: string;
			total: number;
		}
	
		export interface Track
		{
			album: Album;
			artists: Artist[];
			discNumber: number;
			durationMS: number;
			explicit: boolean;
			externalIDS: { isrc: string; };
			externalUrls: ExternalUrls;
			href: string;
			id: string;
			isLocal: boolean;
			isPlayable: boolean;
			name: string;
			popularity: number;
			previewURL: null | string;
			trackNumber: number;
			type: string;
			uri: string;
		}
	
		export interface Album
		{
			albumType: string;
			artists: Artist[];
			externalUrls: ExternalUrls;
			href: string;
			id: string;
			images: Image[];
			name: string;
			releaseDate: Date;
			releaseDatePrecision: string;
			totalTracks: number;
			type: string;
			uri: string;
		}
	
		export interface Artist
		{
			externalUrls: ExternalUrls;
			href: string;
			id: string;
			name: string;
			type: string;
			uri: string;
		}
	
		export interface ExternalUrls
		{
			spotify: string;
		}
	
		export interface Image
		{
			height: number;
			url: string;
			width: number;
		}
	}

	export namespace Deezer
	{
		export function CreateTrackEmbed(track: Track): MessageEmbedOptions
		{
			return {
				author: {
					name: track.artist.name,
					url: track.artist.link,
					icon_url: track.artist.picture,
				},
				title: `${track.title}`,
				url: track.link,
				description: [
					["Album", `[${track.album.title}](https://deezer.com/album/${track.album.id})`],
					["Duration", `${msToTime(track.duration * 1000, false)}`],
					["Explicit", `${track.explicit_lyrics ? "Yes" : "No"}`],
					//["User Ranking", `${track.rank}`],
				].map(([key, value]) => `**${key}**: ${value}`).join('\n'),
				thumbnail: { url: track.album.cover },
				//footer: { text: `Results provided by Deezer`, iconURL: IconLinks.Deezer },
				color: 0xc1f1fc,
			}
		}

		export function CreateTrackField(track: Track): EmbedField
		{
			return {
				name: `${track.title}`,
				value: `From album [${track.album.title}](https://deezer.com/album/${track.album.id}) by [${track.artist.name}](${track.artist.link}), [Listen on Deezer](${track.link})`,
				inline: false,
			}
		}

		export function Search(query: string, type: "track" = "track"): Promise<SearchResponse>
		{
			if (query.length < 3 || query.length > 100) throw new Error("Query must be between 3 and 100 characters.");
			if (type != "track") throw new Error("Invalid type.");

			const url = 'https://api.deezer.com/search?' + ToURLParams({
				'q': query,
			});
			return fetch(url, {
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			}).then(res => res.json()).then(json => json as SearchResponse);
		}

		export interface SearchResponse {
			data:  Track[];
			total: number;
		}
		
		export interface Track {
			id:                      number;
			readable:                boolean;
			title:                   string;
			title_short:             string;
			title_version:           string;
			link:                    string;
			duration:                number;
			rank:                    number;
			explicit_lyrics:         boolean;
			explicit_content_lyrics: number;
			explicit_content_cover:  number;
			preview:                 string;
			md5_image:               string;
			artist:                  Artist;
			album:                   Album;
			type:                    string;
		}
		
		export interface Album {
			id:           number;
			title:        string;
			cover:        string;
			cover_small:  string;
			cover_medium: string;
			cover_big:    string;
			cover_xl:     string;
			md5_image:    string;
			tracklist:    string;
			type:         string;
		}
		
		export interface Artist {
			id:             number;
			name:           string;
			link:           string;
			picture:        string;
			picture_small:  string;
			picture_medium: string;
			picture_big:    string;
			picture_xl:     string;
			tracklist:      string;
			type:           string;
		}
		
	}
}