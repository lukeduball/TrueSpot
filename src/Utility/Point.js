export class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    multiply(scalar)
    {
        return new Point(this.x * scalar, this.y * scalar);
    }

    add(point)
    {
        return new Point(this.x + point.x, this.y + point.y);
    }

    subtract(point)
    {
        return new Point(this.x - point.x, this.y - point.y);
    }
}