import { webHost } from './web-host';
import { supportsFilePickers, toPickerTypes, webDialogs } from './web-dialogs';

const handle = (name: string) => ({ name, kind: 'file' }) as unknown as FileSystemFileHandle;
const abort = () => Promise.reject(new DOMException('The user aborted a request.', 'AbortError'));

describe('webDialogs', () => {
  it('turns filters into picker types and keeps "All files" only for *', () => {
    expect(toPickerTypes([{ name: 'Images', extensions: ['png', '.jpg'] }])).toEqual({
      types: [{ description: 'Images', accept: { 'application/octet-stream': ['.png', '.jpg'] } }],
      excludeAcceptAllOption: true,
    });
    expect(toPickerTypes([{ name: 'PDF', extensions: ['pdf'] }, { name: 'All files', extensions: ['*'] }]).excludeAcceptAllOption).toBe(false);
    expect(toPickerTypes()).toEqual({ types: [], excludeAcceptAllOption: false });
  });

  it('returns handles for chosen files and [] / null when cancelled', async () => {
    const showOpenFilePicker = vi.fn(async () => [handle('a.png'), handle('b.png')]);
    const win = { showOpenFilePicker, showSaveFilePicker: abort, showDirectoryPicker: abort } as unknown as Window;
    const dialogs = webDialogs(win);

    const files = await dialogs.openFile({ multiple: true });
    expect(files.map((f) => f.name)).toEqual(['a.png', 'b.png']);
    expect(files[0].handle).toBeDefined();
    expect(files[0].path).toBeUndefined();
    expect(showOpenFilePicker).toHaveBeenCalledWith({ multiple: true, types: [], excludeAcceptAllOption: false });

    expect(await dialogs.saveFile({ fileName: 'x.txt' })).toBeNull();
    expect(await dialogs.pickFolder()).toBeNull();
    expect(dialogs.message).toBeUndefined();

    showOpenFilePicker.mockImplementationOnce(abort as never);
    expect(await dialogs.openFile()).toEqual([]);
  });

  it('passes other errors through', async () => {
    const fail = () => Promise.reject(new DOMException('Blocked', 'SecurityError'));
    const dialogs = webDialogs({ showOpenFilePicker: fail, showSaveFilePicker: fail, showDirectoryPicker: fail } as unknown as Window);
    await expect(dialogs.openFile()).rejects.toThrow('Blocked');
  });

  it('webHost has dialogs only where the browser has the pickers', () => {
    const base = { document, navigator: { userAgent: '' }, addEventListener() {}, removeEventListener() {} };
    const without = webHost({ window: base as unknown as Window });
    expect(supportsFilePickers(base as unknown as Window)).toBe(false);
    expect(without.dialogs).toBeUndefined();
    expect(without.capabilities.fileDialogs).toBe('none');

    const withPickers = webHost({ window: { ...base, showOpenFilePicker: abort, showSaveFilePicker: abort, showDirectoryPicker: abort } as unknown as Window });
    expect(withPickers.dialogs).toBeDefined();
    expect(withPickers.capabilities.fileDialogs).toBe('partial');
  });
});
