const jwt = require('jsonwebtoken');


const authMiddleware = (req, res, next) =>{

const authHeader = req.headers.authorization;

if(!authHeader){
    return res.status(401).json({
        message:"Authorization token is required",
        success:false
    });
}

const [scheme, token] = authHeader.split(" ");


if(scheme !== "Bearer" || !token){
  
    return res.status(401).json({
        message:"Invalid auth token",
        success:false
    })
}

try {
    
    const decoded = jwt.verify(
        token, process.env.JWT_SECRET,
        {
            algorithms: ["HS256"]
        }
    );

    req.user = decoded;
    next();

} catch (error) {

        return res.status(401).json({
            message:"Invalid or expired token",
            success:false
        });
}

}

module.exports = authMiddleware;