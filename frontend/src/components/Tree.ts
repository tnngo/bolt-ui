import { Component, Vue, Prop, Ref, Watch } from 'vue-property-decorator';
import { Tree as TreeDTO } from '@/dto/Tree';
import { Entry as EntryDTO, Key as KeyDTO } from '@/dto/Entry';
import { ApiService } from '@/services/ApiService';

import Notifications from '@/components/Notifications.vue';
import Entries from '@/components/Entries.vue'
import Spinner from '@/components/Spinner.vue'

@Component({
    components: {
        Entries,
        Spinner,
    },
})
export default class Tree extends Vue {

    @Prop()
    path: KeyDTO[];

    @Prop()
    selected: KeyDTO[];

    @Ref('tree')
    domTree: HTMLDivElement;

    tree: TreeDTO = null;
 
    private readonly apiService = new ApiService(this);

    private readonly loadThresholdInPixels = 50;

    @Watch('path')
    onPathChanged(): void {
        //this.load();
    }

    //@Watch('selected')
    //onSelectedChanged(): void {
    //    this.tryEmitSelected();
    //}

    get selectedInTree(): EntryDTO {
        if (!this.selected || !this.tree) {
            return null;
        }

        for (const entry of this.tree.entries) {
            const entryPath = [
                ...this.path,
                entry.key,
            ]

            if (this.pathHasPrefix(this.selected, entryPath)) {
                return entry;
            }
        }

        return null;
    }

    //private tryEmitSelected(): void {
    //    if (!this.selected || !this.tree) {
    //        return null;
    //    }

    //    if (this.path.length !== this.selected.length - 1) { 
    //        return;
    //    }

    //    for (const entry of this.tree.entries) {
    //        if (entry.bucket) {
    //            continue;
    //        }

    //        const entryPath = [
    //            ...this.path,
    //            entry.key,
    //        ]

    //        if (this.pathIsIdentical(this.selected, entryPath)) {
    //            this.$emit('entry', entry);
    //        }
    //    }

    //    return null;
    //}

    get stringPath(): string {
        return this.path.map(key => key.hex).join('/');
    }

    get firstKey(): KeyDTO {
        if (!this.tree || this.tree.entries.length === 0) {
            return null;
        }

        return this.tree.entries[0].key;
    }

    get lastKey(): KeyDTO {
        if (!this.tree || this.tree.entries.length === 0) {
            return null;
        }

        return this.tree.entries[this.tree.entries.length - 1].key;
    }

    created(): void {
        this.loadSelected();
    }

    onScroll(): void {
        this.loadMoreEntriesIfNeeded();
    }

    onEntry(entry: EntryDTO): void {
        this.emitEntry(entry);
    }

    get selectedKeyInThisBucket(): KeyDTO {
        if (this.selected.length >= this.path.length) {
            return this.selected[this.path.length];
        }

        return null;
    }

    //private loading = false;
    private loadSelected(): void {
        const fromKey = this.selectedKeyInThisBucket;
        const from = fromKey ? fromKey.hex : null;
        console.log(this.stringPath, 'from', from);
        this.load(from)
    }

    private load(from: string): void {
        this.tree = null;

        //this.loading = true;

        this.apiService.browse(this.stringPath, null, null, from)
            .then(
                result => {
                    this.tree = result.data;
                    this.loadMoreEntriesIfNeeded();
                    //this.$emit('path', this.tree.path);
                    //this.tryEmitSelected();

                    // if this key is no longer available try loading all
                    // entries from the bucket, maybe just this key (and
                    // subsequent keys) were removed
                    if (this.tree.entries.length === 0 && from) {
                        this.load(null);
                    }
                },
                error => {
                    Notifications.pushError(this, 'Could not query the backend.', error);
                },
            ).finally(
                () => {
                    //this.loading = false;

                },
            );
    }

    private loadMoreEntriesIfNeeded(): void {
        const scrollPosition = this.domTree.scrollTop;
        const scrollHeight = this.domTree.scrollHeight;
        const clientHeight = this.domTree.clientHeight;

        if (scrollPosition < this.loadThresholdInPixels) {
            this.loadPreviousIfNeeded();
        }

        if (clientHeight + scrollPosition > scrollHeight - this.loadThresholdInPixels) {
            this.loadNextIfNeeded();
        }
    }

    private loadingPrevious = false;
    private noMoreBefore = false;

    private loadPreviousIfNeeded(): void {
        if (this.loadingPrevious || this.noMoreBefore) {
            return;
        }

        const firstKey = this.firstKey;
        if (!firstKey) {
            return;
        }

        this.loadingPrevious = true;

        this.apiService.browse(this.stringPath, firstKey.hex, null, null)
            .then(
                result => {
                    const currentFirstKey = this.firstKey;
                    if (currentFirstKey.hex === firstKey.hex) {
                        if (result.data.entries.length === 0) {
                            this.noMoreBefore = true;
                        }
                        this.tree.entries = [
                            ...this.tree.entries,
                            ...result.data.entries,
                        ];
                    }
                },
                error => {
                    Notifications.pushError(this, 'Could not query the backend.', error);
                },
            ).finally(
                () => {
                    this.loadingPrevious = false;
                    this.loadMoreEntriesIfNeeded();
                }
            );
    }

    private loadingNext = false;
    private noMoreAfter = false;

    private loadNextIfNeeded(): void {
        if (this.loadingNext || this.noMoreAfter) {
            return;
        }

        const lastKey = this.lastKey;
        if (!lastKey) {
            return;
        }

        this.loadingNext = true;

        this.apiService.browse(this.stringPath, null, lastKey.hex, null)
            .then(
                result => {
                    const currentLastKey = this.lastKey;
                    if (currentLastKey.hex === lastKey.hex) {
                        if (result.data.entries.length === 0) {
                            this.noMoreAfter = true;
                        }
                        this.tree.entries = [
                            ...this.tree.entries,
                            ...result.data.entries,
                        ];
                    }
                },
                error => {
                    Notifications.pushError(this, 'Could not query the backend.', error);
                },
            ).finally(
                () => {
                    this.loadingNext = false;
                    this.loadMoreEntriesIfNeeded();
                }
            );
    }

    private pathHasPrefix(path: KeyDTO[], prefix: KeyDTO[]): boolean { 
        if (prefix.length > path.length) {
            return false;
        }

        for (let i = 0; i < prefix.length; i++) {
            if (prefix[i].hex !== path[i].hex) {
                return false;
            }
        }
        return true;
    }

    //private pathIsIdentical(oldValue: KeyDTO[], newValue: KeyDTO[]): boolean {
    //    if (oldValue.length !== newValue.length) {
    //        return false;
    //    }

    //    for (let i = 0; i < oldValue.length; i++) {
    //        if (oldValue[i].hex !== newValue[i].hex) {
    //            return false;
    //        }
    //    }

    //    return true;
    //}

    private emitEntry(entry: EntryDTO): void {
        this.$emit('entry', entry);
    }

}
