interface CanvasStyleProps extends Partial<CSSStyleDeclaration> {
    [key: string]: any;
}

interface CanvasProps extends Omit<Partial<HTMLCanvasElement>, 'style'> {
    style?: CanvasStyleProps;
}

export function assignCanvasProps(canvas: HTMLCanvasElement, props: CanvasProps) {
    for (const [key, value] of Object.entries(props)) {
        if (key === 'style' && typeof value === 'object') {
            assignStyleProps(canvas.style, value as CanvasStyleProps);
        } else {
            (canvas as any)[key] = value;
        }
    }
}

function assignStyleProps(style: CSSStyleDeclaration, props: CanvasStyleProps) {
    for (const [key, value] of Object.entries(props)) {
        (style as any)[key] = value;
    }
}