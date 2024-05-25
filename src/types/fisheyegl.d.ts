declare module 'fisheyegl' {
    interface FisheyeGlOptions {
        image?: string;
        selector?: string;
        lens?: {
            a?: number;
            b?: number;
            Fx?: number;
            Fy?: number;
            scale?: number;
        };
        fov?: {
            x?: number;
            y?: number;
        };
        fragmentSrc?: string;
        vertexSrc?: string;
    }

    interface FisheyeGl {
        getImage(format?: string): HTMLImageElement;
        setImage(image: string): void;
        getCanvasDataUrl(): string;
        getCanvas(): HTMLCanvasElement;
    }

    function FisheyeGl(options: FisheyeGlOptions): FisheyeGl;

    export default FisheyeGl;
}