namespace Test.Project;

using Test.Package;

public class UnitTest1
{
    [Fact]
    public void Test1()
    {
        Assert.Equal(2, Class1.Add(1, 1));
    }
}
