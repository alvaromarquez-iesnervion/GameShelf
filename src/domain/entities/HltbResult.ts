export class HltbResult {

    private main: number | null;
    private mainExtra: number | null;
    private completionist: number | null;

    constructor(
        main: number | null,
        mainExtra: number | null,
        completionist: number | null,
    ) {
        this.main = main;
        this.mainExtra = mainExtra;
        this.completionist = completionist;
    }

    // Horas historia principal (comp_main / 3600). null si no hay datos.
    getMain(): number | null { return this.main; }
    // Horas historia + extras (comp_plus / 3600)
    getMainExtra(): number | null { return this.mainExtra; }
    // Horas completista 100% (comp_100 / 3600)
    getCompletionist(): number | null { return this.completionist; }
}
