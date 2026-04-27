export class LibraryStats {
    constructor(
        public readonly totalUnique: number,
        public readonly pcUnique: number,
        public readonly consoleUnique: number,
        public readonly totalPlaytimeHours: number,
    ) {}
}
