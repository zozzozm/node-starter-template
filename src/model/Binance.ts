export class Subscribe {
    public params: string[] = [];
    private method: string = "SUBSCRIBE";
    public id: number = 1;
    constructor(topics: string[], index: number = 1) {
        this.params = topics;
        this.id = index;
    }
}
