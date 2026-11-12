import type { DialogHost, FileFilter, PickedFile } from '@spartan-native/theme';

/** The File System Access pickers (Chromium). Not in TypeScript's DOM types yet. */
interface PickerType {
  description?: string;
  accept: Record<string, string[]>;
}
interface PickerWindow {
  showOpenFilePicker(options?: {
    multiple?: boolean;
    types?: PickerType[];
    excludeAcceptAllOption?: boolean;
  }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: {
    suggestedName?: string;
    types?: PickerType[];
    excludeAcceptAllOption?: boolean;
  }): Promise<FileSystemFileHandle>;
  showDirectoryPicker(options?: Record<string, never>): Promise<FileSystemDirectoryHandle>;
}

/** True when the browser has all three pickers. */
export function supportsFilePickers(win: Window | undefined): boolean {
  return !!win && 'showOpenFilePicker' in win && 'showSaveFilePicker' in win && 'showDirectoryPicker' in win;
}

/**
 * Turns the contract's filters into picker types. The pickers key extensions by MIME type;
 * `application/octet-stream` is accepted for any extension, so the extensions do the filtering.
 * A `*` filter means "all files": it keeps the browser's own "All files" entry instead.
 */
export function toPickerTypes(filters: readonly FileFilter[] = []): {
  types: PickerType[];
  excludeAcceptAllOption: boolean;
} {
  const matchesAll = filters.length === 0 || filters.some((f) => f.extensions.includes('*'));
  const types = filters
    .filter((f) => !f.extensions.includes('*') && f.extensions.length > 0)
    .map((f) => ({
      description: f.name,
      accept: { 'application/octet-stream': f.extensions.map((e) => '.' + e.replace(/^\./, '')) },
    }));
  return { types, excludeAcceptAllOption: !matchesAll };
}

const picked = (handle: FileSystemHandle): PickedFile => ({ name: handle.name, handle });

/** Cancelling a picker rejects with AbortError: that's an answer, not a failure. */
async function orCancelled<T>(run: () => Promise<T>, cancelled: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return cancelled;
    throw e;
  }
}

/** DialogHost on the File System Access API. No `message()`: browsers have no OS alert with custom buttons. */
export function webDialogs(win: Window): DialogHost {
  const pickers = win as unknown as PickerWindow;
  return {
    openFile: (options = {}) =>
      orCancelled(async () => {
        const handles = await pickers.showOpenFilePicker({
          multiple: !!options.multiple,
          ...toPickerTypes(options.filters),
        });
        return handles.map(picked);
      }, [] as PickedFile[]),
    saveFile: (options = {}) =>
      orCancelled(
        async () =>
          picked(
            await pickers.showSaveFilePicker({ suggestedName: options.fileName, ...toPickerTypes(options.filters) }),
          ),
        null,
      ),
    pickFolder: () => orCancelled(async () => picked(await pickers.showDirectoryPicker()), null),
  };
}
