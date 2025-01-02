#calculator

num1 = int(input("Number 1: "))
operator = input("Select Operator +-*/: ")
num2 = int(input("Number 2: "))

if operator == "+":
    result = num1 + num2
    print(f"{result}")
elif operator == "-":
    result = num1 - num2
    print(f"{result}")
elif operator == "*":
    result = num1 * num2
    print(f"{result}")
elif operator == "/":
    result = num1 / num2
    print(f"{result}")