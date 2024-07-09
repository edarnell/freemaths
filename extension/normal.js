// testing suggests more accurate than calculator - try Ncdf(Ninv(0.95))
function Ncdf(z) {
    var k, m, values, total, item, z2, z4, a, b;
	// j,kMax,subtotal
    // Power series is not stable at these extreme tail scenarios
    if (z < -6) { return 0; }
    if (z >  6) { return 1; }

    m      = 1;        // m(k) == (2**k)/factorial(k)
    b      = z;        // b(k) == z ** (2*k + 1)
    z2     = z * z;    // cache of z squared
    z4     = z2 * z2;  // cache of z to the 4th
    values = [];

    // Compute the power series in groups of two terms.
    // This reduces floating point errors because the series
    // alternates between positive and negative.
    for (k=0; k<100; k+=2) {
        a = 2*k + 1;
        item = b / (a*m);
        item *= (1 - (a*z2)/((a+1)*(a+2)));
        values.push(item);
        m *= (4*(k+1)*(k+2));
        b *= z4;
    }

    // Add the smallest terms to the total first that
    // way we minimize the floating point errors.
    total = 0;
    for (k=49; k>=0; k--) {
        total += values[k];
    }

    // Multiply total by 1/sqrt(2*PI)
    // Then add 0.5 so that stdNormal(0) === 0.5
    return 0.5 + 0.3989422804014327 * total;
}
// testing suggests more accurate than calculator - try Ncdf(Ninv(0.95))
function Ninv(p) {
    // Based on Wichura et. al. fortran http://lib.stat.cmu.edu/apstat/241
    // ALGORITHM AS241  APPL. STATIST. (1988) VOL. 37, NO. 3
    let ret, r
    if (p <= 0 || p >= 1) return "?P"
    const split1 = 0.425, split2 = 5, const1 = 0.180625, const2 = 1.6
    // P near to 1/2
    const a0 = 3.3871328727963666080, a1 = 1.3314166789178437745e2, a2 = 1.9715909503065514427e3,
        a3 = 1.3731693765509461125e4, a4 = 4.5921953931549871457e4, a5 = 6.7265770927008700853e4,
        a6 = 3.3430575583588128105e4, a7 = 2.5090809287301226727e3,
        b1 = 4.2313330701600911252e1, b2 = 6.8718700749205790830e2, b3 = 5.3941960214247511077e3,
        b4 = 2.1213794301586595867e4, b5 = 3.9307895800092710610e4, b6 = 2.8729085735721942674e4,
        b7 = 5.2264952788528545610e3
    // P not near to 1/2 or 0 or 1
    const c0 = 1.42343711074968357734e0, c1 = 4.63033784615654529590e0, c2 = 5.76949722146069140550e0,
        c3 = 3.64784832476320460504e0, c4 = 1.27045825245236838258e0, c5 = 2.41780725177450611770e-1,
        c6 = 2.27238449892691845833e-2, c7 = 7.74545014278341407640e-4,
        d1 = 2.05319162663775882187e0, d2 = 1.67638483018380384940e0, d3 = 6.89767334985100004550e-1,
        d4 = 1.48103976427480074590e-1, d5 = 1.51986665636164571966e-2, d6 = 5.47593808499534494600e-4,
        d7 = 1.05075007164441684324e-9
    // P near 0 or 1
    const e0 = 6.65790464350110377720e0, e1 = 5.46378491116411436990e0, e2 = 1.78482653991729133580e0,
        e3 = 2.96560571828504891230e-1, e4 = 2.65321895265761230930e-2, e5 = 1.24266094738807843860e-3,
        e6 = 2.71155556874348757815e-5, e7 = 2.01033439929228813265e-7,
        f1 = 5.99832206555887937690e-1, f2 = 1.36929880922735805310e-1, f3 = 1.48753612908506148525e-2,
        f4 = 7.86869131145613259100e-4, f5 = 1.84631831751005468180e-5, f6 = 1.42151175831644588870e-7,
        f7 = 2.04426310338993978564e-15
    const q = p - 0.5
    if (Math.abs(q) <= split1) {
        r = const1 - q * q
        ret = q * (((((((a7 * r + a6) * r + a5) * r + a4) * r + a3)
            * r + a2) * r + a1) * r + a0) / (((((((b7 * r + b6) * r + b5)
                * r + b4) * r + b3) * r + b2) * r + b1) * r + 1)
    }
    else {
        r = q < 0 ? p : 1 - p
        if (r <= 0) return '?P?'
        r = Math.sqrt(-Math.log(r))
        if (r <= split2) {
            r = r - const2
            ret = (((((((c7 * r + c6) * r + c5) * r + c4) * r + c3)
                * r + c2) * r + c1) * r + c0) / (((((((d7 * r + d6) * r + d5)
                    * r + d4) * r + d3) * r + d2) * r + d1) * r + 1)
        }
        else {
            r = r - split2
            ret = (((((((e7 * r + e6) * r + e5) * r + e4) * r + e3)
                * r + e2) * r + e1) * r + e0) / (((((((f7 * r * + f6) * r + f5)
                    * r + f4) * r + f3) * r + f2) * r * + f1) * r + 1)
        }
        if (q < 0) ret = -ret
    }
    return ret
}
export {Ninv,Ncdf}