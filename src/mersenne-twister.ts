/*
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.

   Before using, initialize the state by using init_genrand(seed)
   or init_by_array(init_key, key_length).

   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote
        products derived from this software without specific prior written
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

/** MT19937. The initialization and output match the original simulator's generator. */
export class MersenneTwister {
  private readonly state = new Uint32Array(624);
  private index = 625;

  seed(seed: number): void {
    this.state[0] = seed >>> 0;
    for (let i = 1; i < 624; i++) {
      const previous = this.state[i - 1];
      this.state[i] = (Math.imul(1812433253, previous ^ (previous >>> 30)) + i) >>> 0;
    }
    this.index = 624;
  }

  seedArray(keys: readonly number[]): void {
    if (keys.length === 0) throw new Error('A seed array must contain at least one number.');
    this.seed(19650218);
    let i = 1;
    let j = 0;
    for (let k = Math.max(624, keys.length); k > 0; k--) {
      const previous = this.state[i - 1];
      this.state[i] = ((this.state[i] ^ Math.imul(previous ^ (previous >>> 30), 1664525)) + keys[j] + j) >>> 0;
      i++;
      j++;
      if (i >= 624) {
        this.state[0] = this.state[623];
        i = 1;
      }
      if (j >= keys.length) j = 0;
    }
    for (let k = 623; k > 0; k--) {
      const previous = this.state[i - 1];
      this.state[i] = ((this.state[i] ^ Math.imul(previous ^ (previous >>> 30), 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) {
        this.state[0] = this.state[623];
        i = 1;
      }
    }
    this.state[0] = 0x80000000;
  }

  nextInt32(): number {
    if (this.index >= 624) {
      if (this.index === 625) this.seed(5489);
      for (let i = 0; i < 624; i++) {
        const y = (this.state[i] & 0x80000000) | (this.state[(i + 1) % 624] & 0x7fffffff);
        this.state[i] = (this.state[(i + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)) >>> 0;
      }
      this.index = 0;
    }
    let y = this.state[this.index++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  real1(): number {
    return this.nextInt32() / 4294967295;
  }

  real2(): number {
    return this.nextInt32() / 4294967296;
  }

  resolution53(): number {
    const a = this.nextInt32() >>> 5;
    const b = this.nextInt32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }
}
