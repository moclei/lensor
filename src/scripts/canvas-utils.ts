interface StyleProps extends Partial<CSSStyleDeclaration> {
    [key: string]: any;
}

interface CanvasProps extends Omit<Partial<HTMLCanvasElement>, 'style'> {
    style?: StyleProps;
}

export function assignCanvasProps(canvas: HTMLElement, props: CanvasProps) {
    for (const [key, value] of Object.entries(props)) {
        if (key === 'style' && typeof value === 'object') {
            assignStyleProps(canvas.style, value as StyleProps);
        } else {
            (canvas as any)[key] = value;
        }
    }
}

function assignStyleProps(style: CSSStyleDeclaration, props: StyleProps) {
    for (const [key, value] of Object.entries(props)) {
        (style as any)[key] = value;
    }
}