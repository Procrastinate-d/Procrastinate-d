from tkinter import *
# Warning: complete novice, doesn't understand OOP

class GUITemplate:
    data, root = [], None

    def __init__(self):
        print("Init doesn't allow returns.")

    def __new__(cls):  # Called every time it is initialized.
        cls.root = Tk()
        cls.root.geometry("250x900")
        distasteful_font = ("Comic Sans MS", 10, "bold")

        v1 = StringVar()
        v2 = IntVar()
        v3 = IntVar()
        v4 = IntVar()
        v5 = IntVar()
        v6 = StringVar()

        # Used for a specific project, can modify.
        Label(cls.root, text="File path:", font=distasteful_font).pack(anchor=W, pady=3)
        e1 = Entry(cls.root, bd=5, textvariable=v1)
        e1.insert('0', "./static/")
        e1.pack(anchor=W)
        Label(cls.root, text="Confidence:", font=distasteful_font).pack(anchor=W)
        e2 = Entry(cls.root, bd=5, textvariable=v2)
        e2.insert('0', '6')
        e2.pack(anchor=W)
        Label(cls.root, text="Time between pictures:", font=distasteful_font).pack(anchor=W)
        e3 = Entry(cls.root, bd=5, textvariable=v3)
        e3.insert('1', '5')
        e3.pack(anchor=W)
        Label(cls.root, text="Max snapshots:", font=distasteful_font).pack(anchor=W)
        e4 = Entry(cls.root, bd=5, textvariable=v4)
        e4.insert('0', '1')
        e4.pack(anchor=W)
        Label(cls.root, text="Time to update comparison:", font=distasteful_font).pack(anchor=W)
        e5 = Entry(cls.root, bd=5, textvariable=v5)
        e5.insert('0', '2')  # I default to 20 min.
        e5.pack(anchor=W)
        Label(cls.root, text="^ Unit:", font=distasteful_font).pack(anchor=W)
        e6 = Entry(cls.root, bd=5, textvariable=v6)
        e6.insert('0', 'S')  # FOR TESTING PURPOSES
        e6.pack(anchor=W)

        b1 = IntVar()
        b2 = IntVar()
        b3 = IntVar()
        Label(cls.root, text="RPI board: Sprinkler", font=distasteful_font).pack(anchor=W)
        Radiobutton(cls.root, text="Unchanged", variable=b1, value=0).pack(anchor=W)
        Radiobutton(cls.root, text="OFF", variable=b1, value=1).pack(anchor=W)
        Radiobutton(cls.root, text="ON", variable=b1, value=2).pack(anchor=W)
        Radiobutton(cls.root, text="TRIGGER", variable=b1, value=3).pack(anchor=W)
        Label(cls.root, text="RPI board: Buzzer", font=distasteful_font).pack(anchor=W)
        Radiobutton(cls.root, text="Unchanged", variable=b2, value=0).pack(anchor=W)
        Radiobutton(cls.root, text="OFF", variable=b2, value=1).pack(anchor=W)
        Radiobutton(cls.root, text="ON", variable=b2, value=2).pack(anchor=W)
        Label(cls.root, text="RPI board: LED", font=distasteful_font).pack(anchor=W)
        Radiobutton(cls.root, text="Unchanged", variable=b3, value=0).pack(anchor=W)
        Radiobutton(cls.root, text="OFF", variable=b3, value=1).pack(anchor=W)
        Radiobutton(cls.root, text="ON", variable=b3, value=2).pack(anchor=W)

        # Has __new__ nonesense is because root.destroy causes an error.
        # This is so "Submit" both closes the window and allows data to pass through.
        # Which again, I say, I don't know what I'm doing.
        Button(cls.root, text="Submit", command=cls.root.destroy).pack(anchor=S)
        cls.root.mainloop()

        data = [v1.get(), v2.get(), v3.get(), v4.get(), v5.get(), v6.get(), b1.get(), b2.get(), b3.get()]
        return data

# Use these two commands to open a window and output the data.
save = list(GUITemplate())  # (Default values DO NOT CHANGE.)
print(save)
