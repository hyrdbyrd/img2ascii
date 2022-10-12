const form = document.getElementById('form');

const textPreview = document.getElementById('text-preview');
const canvasPreview = document.getElementById('canvas-preview');

const canvas = document.getElementById('canvas');

const getAvg = ([r, g, b]) => (r + g + b) / 3;

const getBrightness = (px) => getAvg(px) / 255;

const getSymbolByPixel = (density, px) =>
    density[
        Math.min(
            Math.floor(getBrightness(px) * density.length),
            density.length - 1
        )
    ];

const getTextByPixels = (
    density,
    size,
    pxls,
    space = '&nbsp;',
    newline = '<br />'
) => {
    let res = '';

    for (let i = 0; i < pxls.length; i += 4) {
        const curIdx = i / 4;
        if (curIdx % size === 0) res += newline;

        const r = pxls[i + 0];
        const g = pxls[i + 1];
        const b = pxls[i + 2];

        const px = [r, g, b];

        const symb = getSymbolByPixel(density, px);

        if (symb === ' ') res += space;
        else res += symb;
    }

    return res;
};

const generate = async () => {
    const density = form.symbols.value;
    const uploader = form['file-uploader'];
    const size = Number(form['preview-size'].value);
    const fontSize = Number(form['font-size'].value);

    canvas.width = size;
    canvas.height = size;

    canvasPreview.width = (size * fontSize) / 2;
    canvasPreview.height = (size * fontSize) / 2;

    for (const file of [...uploader.files]) {
        /**
         * @type {CanvasRenderingContext2D}
         */
        const previewCtx = canvasPreview.getContext('2d');
        /**
         * @type {CanvasRenderingContext2D}
         */
        const ctx = canvas.getContext('2d');

        previewCtx.font = `${fontSize}px monospace`;

        previewCtx.clearRect(0, 0, previewCtx.width, previewCtx.height);
        ctx.clearRect(0, 0, ctx.width, ctx.height);
        textPreview.innerHTML = '';

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => (img.onload = resolve));

        const { width: w, height: h } = img;

        const diff = Math.abs(w - h) / 2;

        const wgh = w > h;
        const hgw = h > w;

        // Центрируем горизонтальное/вертикальное изображение
        ctx.drawImage(
            img,
            wgh ? diff : 0,
            hgw ? diff : 0,
            wgh ? w - diff : w,
            hgw ? h - diff : h,
            0,
            0,
            size,
            size
        );

        const imgData = ctx.getImageData(0, 0, size, size);

        const list = getTextByPixels(density, size, imgData.data, ' ', '\n')
            .split('\n')
            .entries();

        for (const [y, text] of list)
            previewCtx.fillText(
                text,
                0,
                (y * fontSize) / 2,
                canvasPreview.width
            );

        textPreview.innerHTML = getTextByPixels(density, size, imgData.data);
    }
};
