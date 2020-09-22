export class Subscribe {
    public params: string[] = [];
    private method: string = "SUBSCRIBE";
    private id: number = 1;
    constructor(topics: string[]) {
        this.params = topics;
    }
}
