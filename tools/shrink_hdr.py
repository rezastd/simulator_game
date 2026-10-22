#!/usr/bin/env python3
"""
Downsample Radiance .hdr (RGBE) equirectangular images for use as
image-based-lighting environments.

  python3 tools/shrink_hdr.py assets/hdr/sky-park.hdr 512 256

Writes <name>-small.hdr next to the source.  A 512x256 equirect is
plenty for IBL and is ~8x smaller than a 1K HDR.
"""
import sys
import os
import numpy as np


def read_hdr(path):
    with open(path, 'rb') as f:
        data = f.read()

    # --- header ---
    pos = 0
    while True:
        nl = data.index(b'\n', pos)
        line = data[pos:nl]
        pos = nl + 1
        if line.strip() == b'':
            break
    # resolution line
    nl = data.index(b'\n', pos)
    res = data[pos:nl].decode('ascii').strip()
    pos = nl + 1
    parts = res.split()
    height = int(parts[1])
    width = int(parts[3])

    pixels = np.zeros((height, width, 4), dtype=np.uint8)

    # --- scanlines ---
    for y in range(height):
        if width < 8 or width > 0x7fff or data[pos] != 2 or data[pos + 1] != 2:
            # flat (or old-style RLE) scanline
            scan = np.frombuffer(data, dtype=np.uint8, count=width * 4, offset=pos)
            pixels[y] = scan.reshape(width, 4)
            pos += width * 4
            continue

        # new adaptive RLE: the 4 channels are stored as 4 separate streams
        pos += 4
        nch = 4
        chan = np.zeros((nch, width), dtype=np.uint8)
        for ch in range(nch):
            x = 0
            while x < width:
                code = data[pos]; pos += 1
                if code > 128:
                    count = code - 128
                    val = data[pos]; pos += 1
                    chan[ch, x:x + count] = val
                    x += count
                else:
                    count = code
                    chan[ch, x:x + count] = np.frombuffer(
                        data, dtype=np.uint8, count=count, offset=pos)
                    pos += count
                    x += count
        pixels[y] = chan.T

    return pixels


def write_hdr(path, pixels):
    height, width = pixels.shape[0], pixels.shape[1]
    header = b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y %d +X %d\n' % (height, width)
    with open(path, 'wb') as f:
        f.write(header)
        f.write(pixels.tobytes())


def to_float(rgb):
    """RGBE -> linear float.  f = (mant + 0.5) / 256 * 2^(e - 128)"""
    e = rgb[:, :, 3].astype(np.int32)
    mant = rgb[:, :, :3].astype(np.float64) + 0.5
    scale = np.where(e == 0, 0.0, np.ldexp(1.0, e - 136))
    return mant * scale[..., None]


def to_rgbe(f):
    """linear float -> RGBE.
    f = (mant + 0.5) * 2^(e_raw - 136)   with e_raw = floor(log2 v) + 1 + 128
    """
    v = np.max(f, axis=2)
    e = np.zeros_like(v, dtype=np.int32)
    nz = v > 0
    e[nz] = (np.floor(np.log2(v[nz])).astype(np.int32) + 1 + 128)
    scale = np.ldexp(1.0, e - 136)          # 2^(e_raw - 136)
    scale[scale == 0] = 1.0
    out = np.zeros((f.shape[0], f.shape[1], 4), dtype=np.uint8)
    mant = f / scale[..., None] - 0.5
    out[:, :, :3] = np.clip(np.floor(mant + 0.5), 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(e, 0, 255).astype(np.uint8)
    return out


def main():
    src = sys.argv[1]
    target_w = int(sys.argv[2]) if len(sys.argv) > 2 else 512
    target_h = int(sys.argv[3]) if len(sys.argv) > 3 else 256

    px = read_hdr(src)
    f = to_float(px)

    # self-check: the RGBE -> float -> RGBE round trip must be lossless
    rt = to_rgbe(f)
    drift = float(np.abs(rt.astype(np.int16) - px.astype(np.int16)).mean())
    if drift > 1.0:
        raise SystemExit(f'round-trip error too high ({drift:.2f}) — aborting')

    # box-filter downsample
    h, w = f.shape[0], f.shape[1]
    yi = (np.arange(target_h) * h // target_h)
    xi = (np.arange(target_w) * w // target_w)
    y0 = yi
    y1 = np.minimum(yi + h // target_h, h)
    x0 = xi
    x1 = np.minimum(xi + w // target_w, w)
    out = np.zeros((target_h, target_w, 3))
    for j in range(target_h):
        for i in range(target_w):
            block = f[y0[j]:y1[j], x0[i]:x1[i]]
            out[j, i] = block.reshape(-1, 3).mean(axis=0)

    dst = src.replace('.hdr', '-small.hdr')
    write_hdr(dst, to_rgbe(out))
    print(f'{src}: {os.path.getsize(src)//1024}KB -> {dst}: {os.path.getsize(dst)//1024}KB')


if __name__ == '__main__':
    main()
