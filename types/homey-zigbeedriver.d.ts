declare module 'homey-zigbeedriver' {
    export class ZigBeeDriver {
        log(...args: any[]): void;
        error(...args: any[]): void;
        homey: any;
    }
} 