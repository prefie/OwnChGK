export const wordFormat = (count: number) => {
    let numberEnd = count % 100;
    if (numberEnd > 19) {
        numberEnd = numberEnd % 10;
    }
    switch (numberEnd) {
        case 1: {
            return 'команда';
        }
        case 2:
        case 3:
        case 4: {
            return 'команды';
        }
        default: {
            return 'команд';
        }
    }
};
