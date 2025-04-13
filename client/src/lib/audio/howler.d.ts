declare module 'howler' {
  export interface HowlOptions {
    src: string[];
    volume?: number;
    html5?: boolean;
    loop?: boolean;
    preload?: boolean;
    autoplay?: boolean;
    mute?: boolean;
    sprite?: Record<string, [number, number]>;
    rate?: number;
    pool?: number;
    format?: string[];
    xhrWithCredentials?: boolean;
    onload?: () => void;
    onloaderror?: (id: number, error: any) => void;
    onplay?: (id: number) => void;
    onplayerror?: (id: number, error: any) => void;
    onend?: (id: number) => void;
    onpause?: (id: number) => void;
    onstop?: (id: number) => void;
    onmute?: (id: number) => void;
    onvolume?: (id: number) => void;
    onrate?: (id: number) => void;
    onseek?: (id: number) => void;
    onfade?: (id: number) => void;
    onunlock?: () => void;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(sprite?: string): number;
    pause(id?: number): this;
    stop(id?: number): this;
    mute(muted?: boolean, id?: number): this | boolean;
    volume(vol?: number, id?: number): this | number;
    fade(from: number, to: number, duration: number, id?: number): this;
    rate(rate?: number, id?: number): this | number;
    seek(seek?: number, id?: number): this | number;
    loop(loop?: boolean, id?: number): this | boolean;
    state(): 'unloaded' | 'loading' | 'loaded';
    playing(id?: number): boolean;
    duration(id?: number): number;
    on(event: string, callback: Function, id?: number): this;
    once(event: string, callback: Function, id?: number): this;
    off(event: string, callback?: Function, id?: number): this;
    load(): this;
    unload(): void;
  }

  export interface Howler {
    mute(muted: boolean): void;
    volume(volume?: number): number | this;
    stop(): void;
    codecs(ext: string): boolean;
    autoUnlock: boolean;
    autoSuspend: boolean;
    ctx: AudioContext;
    masterGain: GainNode;
  }

  export const Howler: Howler;
}