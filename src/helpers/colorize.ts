const colorMap = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
}

const codeMap = {
    2: 'green',
    3: 'yellow',
    4: 'red',
    5: 'red'
}

const methodMap = {
    'GET': 'green',
    'POST': 'yellow',
    'PUT': 'yellow',
    'PATCH': 'cyan',
    'DELETE': 'red'
}

export default function(input: string, color?: string, statusCode?: number, method?: string): string {
    try {
        if (statusCode) {
            color = codeMap[Number(statusCode.toString().slice(0, 1))];
        }
        else if (method) {
            color = methodMap[method];
        }

        const colorized = `${colorMap[color]}${input}\x1b[0m`;
        return colorized;
    } catch {
        return input;
    }
}
