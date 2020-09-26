export class Subscribe {
    public params: string[] = [];
    public id: number = 1;
    private method: string = "SUBSCRIBE";
    constructor(topics: string[], index: number = 1) {
        this.params = topics;
        this.id = index;
    }
}
