
const hashPassword = async (password) => {
    async function sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }

        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;
        var result = '';
        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;
        var hash = [];
        var k = [];
        var primeCounter = 0;

        var isPrime = [2];
        var getIteration = function (n) {
            for (var i = 3; primeCounter < 64; i += 2) {
                if (!isPrime.some(function (p) { return i % p === 0; })) {
                    isPrime.push(i);
                    hash[primeCounter] = (mathPow(i, 1 / 2) * maxWord) | 0;
                    k[primeCounter++] = (mathPow(i, 1 / 3) * maxWord) | 0;
                }
            }
        };
        getIteration();

        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return;
            words[i >> 2] |= j << ((3 - i % 4) * 8);
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength | 0);

        for (j = 0; j < words[lengthProperty]; j += 16) {
            var w = words.slice(j, j + 16);
            var oldHash = hash.slice(0);
            hash = hash.slice(0);
            for (i = 0; i < 64; i++) {
                var w15 = w[i - 15], w2 = w[i - 2];
                var a = hash[0], e = hash[4];
                var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }
            for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
        }

        for (i = 0; i < 8; i++) {
            for (j = 3; j >= 0; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? '0' : '') + b.toString(16);
            }
        }
        return result;
    }
    return await sha256(password);
}

const test = async () => {
    const hash = await hashPassword('admin123');
    const expected = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    console.log('Hash calcolato:', hash);
    console.log('Hash atteso:   ', expected);
    if (hash === expected) {
        console.log('✅ TEST SUPERATO!');
    } else {
        console.log('❌ TEST FALLITO!');
    }
}

test();
