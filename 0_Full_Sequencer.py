import time
import pyaudio                         # Audio imports
import wave
from pydub import AudioSegment
import scipy.io                        # To calculate
import numpy as np
from matplotlib import pyplot as plt   # To plot
from pylab import *
from scipy.fft import rfft, rfftfreq   # FFT function - If required: from scipy.fft import fft, fftfreq
from scipy.io.wavfile import write     # File editing... WRITE
from scipy.io import wavfile as wav    # File editing... READ

"""
This file was created to take in audio and spit out its relevant notes in online sequencer.
Basically, i hum, it go brr-rrr...

EDIT MANUAL SETTINGS:
[D] = Normally disabled.
[T] = For testing purposes, probably normally disabled.
[A] = Avoid changing unless you know what you're doing.
"""
# ________________________________________________________________________
# Basic Settings
instrument = 15                  # 📌 Manually select instrument
en_instrument = False            # [D] Select instrument after <Run>
en_print_notes = 2               # [D] 1 prints notes, 2 includes note frequencies, 3 includes a .txt file
start_pos = 0                    # Starting position for the notes, 1 per cell. (note: Ctrl+C from right to left)

# Audio Source Settings
en_record = False                              # [D] Enable recording.
audio_file = 'sequencer_files/recording2.wav'  # 📌 File to be translated. Default: 'sequencer_files/recording.wav'
temp_file = 'sequencer_files/temporary.wav'   # 📌 To measure at intervals. Default: 'sequencer_files/temporary.wav'
en_imported = False                           # To standardize. (Please convert 2 channels to 1)
convert_file = "sequencer_files/recording2.wav"  # File used to convert to "audio_file". wav needed

# [T] Interval Marker Settings (doesn't affect output)
en_interval_marker = False       # [D] I/M: Create a horizontal line (paste sequence) for every interval.
interval_instrument = '2'        # I/M: Default: '2' (Drum Kit), to be pasted, muted and locked.
interval_range = [0, None]       # I/M: Range to plant intervals. [sec]
interval_note = 'C6'             # I/M: Note/height on the sequencer
interval_manual = 600            # Default: 250 or 600
interval_width = 0.2             # Default: 0.1

# [T] Plotting (doesn't affect the output)
en_plotter = False               # [D] Plot: Enable per interval. (checking)
plot_close = False               # [D] Plot: Enable automatic window closing. (Set as 3s)
plot_small_scale = True          # Plot: Smaller (2000 Hz) and shows note harmonics. Includes more details.
plot_ignore_0 = True             # Plot: Ignores showing 0s. (no colored lines)
plot_range = 4000                # Plot: Frequency range. (Default: 4000)
plot_start = 0                   # Plot: Starting time. [sec]
plot_shape = "."                 # Plot: dot, cross, e.t.c.
LINE_COLOR = 'white'             # Plot: Outline Color
BACK_COLOR = 'black'             # Plot: Background Color

# [A] Quality Settings
interval = 250/4                   # Window of time for measuring. Smaller = more notes. (Default: 250ms)
#    Decreasing duration gives more notes (smoother rises) and higher notes slipping in (30 vs 200)
#    If there's a lot of empty notes, your interval is probably too small.
BPM = 100                        # 📌 Online Sequencer's default: 110 (Default: 100)
#    This assumes 4 max notes hummed per second.
#    Increase speed by decreasing "BPM"'s value here.
length_constant = 0              # Minimum length of note. (Default: 0, 0.5)
en_grid_length = False           # [D] Fit each note into a grid space (Default: 1, site uses 1/4)
GRID = 1/8                       # Unfortunately, it may cause notes to occur at the same time.

# [A] Filter Settings
softness = 1.5                   # Volume Threshold to filter noise from note. (Default: 1.5)
#    Affected by noise and how loud your voice is. (See green line in plotting.)
octave_range = ['C3', 'C6']      # To sample between these frequencies. Default: Vocals ['C3, C6'] , None ['C2', 'B7']
en_smooth_filter = False          # 📌 Enables the following:
s_interval = 1                   # Splitting into semi intervals. (Default: 4)
smooth_gate = 1                  # Note Filter [3: redundant only, 2: include repeated, 1: allow rising/falling notes]
en_short_flag = False            # [D] Flags single-instance notes to be easily cleared
short_instrument = 6             # Instrument for "en_short_flag"
# ________________________________________________________________________

# Online Sequencer's list of instruments (for reference only)
ISTM_index = {'Electric Piano': 43, 'Grand Piano': 41, 'Harpsichord': 17, 'Ragtime Piano': 25, 'Music Box': 26, 'Elec. Piano (Classic)': 0, 'Grand Piano (Classic)': 8, 'Drum Kit': 2, 'Electric Drum Kit': 31, 'Xylophone': 19, 'Vibraphone': 34, 'Steel Drums': 21, '8-Bit Drum Kit': 39, '2013 Drum kit': 40, '808 Drum Kit': 36, '909 Drum Kit': 42, 'Acoustic Guitar': 1, 'Electric Guitar': 4, 'Bass': 48, 'Bass (Classic)': 5, 'Slap Bass': 29, 'Jazz Guitar': 32, 'Muted E-Guitar': 35, 'Distortion Guitar': 38, 'Dist. Guitar (Sustain)': 44, 'Clean Guitar': 49, 'Sitar': 22, 'Koto': 33, 'Smooth Synth': 3, 'Synth Pluck': 6, 'Scifi': 7, '8-Bit Sine': 13, '8-Bit Square': 14, '8-Bit Sawtooth': 15, '8-Bit Triangle': 16, 'French Horn': 9, 'Trombone': 10, 'Violin': 11, 'Violin (Sustain)': 46, 'Cello': 12, 'Cello (Sustain)': 45, 'Concert Harp': 18, 'Pizzicato': 20, 'Flute': 23, 'Strings (Sustain)': 47, 'Saxophone': 24, 'Synth Bass': 27, 'Church Organ': 28, 'Pop Synth': 30, '808 Bass': 37}
Rev_ISTM_index = {43: 'Electric Piano', 41: 'Grand Piano', 17: 'Harpsichord', 25: 'Ragtime Piano', 26: 'Music Box', 0: 'Elec. Piano (Classic)', 8: 'Grand Piano (Classic)', 2: 'Drum Kit', 31: 'Electric Drum Kit', 19: 'Xylophone', 34: 'Vibraphone', 21: 'Steel Drums', 39: '8-Bit Drum Kit', 40: '2013 Drum kit', 36: '808 Drum Kit', 42: '909 Drum Kit', 1: 'Acoustic Guitar', 4: 'Electric Guitar', 48: 'Bass', 5: 'Bass (Classic)', 29: 'Slap Bass', 32: 'Jazz Guitar', 35: 'Muted E-Guitar', 38: 'Distortion Guitar', 44: 'Dist. Guitar (Sustain)', 49: 'Clean Guitar', 22: 'Sitar', 33: 'Koto', 3: 'Smooth Synth', 6: 'Synth Pluck', 7: 'Scifi', 13: '8-Bit Sine', 14: '8-Bit Square', 15: '8-Bit Sawtooth', 16: '8-Bit Triangle', 9: 'French Horn', 10: 'Trombone', 11: 'Violin', 46: 'Violin (Sustain)', 12: 'Cello', 45: 'Cello (Sustain)', 18: 'Concert Harp', 20: 'Pizzicato', 23: 'Flute', 47: 'Strings (Sustain)', 24: 'Saxophone', 27: 'Synth Bass', 28: 'Church Organ', 30: 'Pop Synth', 37: '808 Bass'}

# [A] Unit Conversion
softness = softness * 1000000  # softness * (1e+6)
plot_start = plot_start * 1000.0

# [A] Audio Parameters Settings
SAMPLE_RATE = 48000    # Must be consistent. Otherwise, output will have distorted frequencies.
CHANNELS = 1           # Will affect what kind of array comes out. (ONLY 1.)
FramesPB = 1024        #

# [A] Plotting Color Settings (See 'rcParams.keys()')
plt.rcParams['axes.facecolor'] = BACK_COLOR
plt.rcParams['figure.facecolor'] = BACK_COLOR
mpl.rcParams['text.color'] = LINE_COLOR
mpl.rcParams['axes.labelcolor'] = LINE_COLOR
mpl.rcParams['xtick.color'] = LINE_COLOR
mpl.rcParams['ytick.color'] = LINE_COLOR
plt.rcParams['axes.edgecolor'] = LINE_COLOR

if not en_plotter:  # Avoid keeping time if plotting. To give you perspective, it takes 37.03s for 263/1544 notes, time 1:36
    conversion_start = time.time()

# ________________________________________________________________________
# Stage 1: Get appropriate file.
# Run/Edit config > Emulate terminal in output console to record.
# Note that doing so will cause the output to not be a single line.
# (Please record it in another file or import instead.)


def file_record(audio_file, CHANNELS, SAMPLE_RATE, FramesPB):
    audio = pyaudio.PyAudio()  # Create instance/Define object
    stream = audio.open(format=pyaudio.paInt16, channels=CHANNELS, rate=SAMPLE_RATE, input=True, frames_per_buffer=FramesPB)
    frames = []
    try:  # Record data
        print("\n\nRecording... Stop with Ctrl+C.\n(If not stopping, please \"edit configuration\".)")
        while True:
            data = stream.read(FramesPB)           # seconds * RATE/FramesPB = total duration
            frames.append(data)
    except KeyboardInterrupt:
        print("Done recording")
        pass
    stream.stop_stream()
    stream.close()
    audio.terminate()

    sound_file = wave.open(audio_file, mode="wb")  # Write
    sound_file.setnchannels(CHANNELS)
    sound_file.setsampwidth(2)                     # It expects bytes, not audio.get_sample_size(pyaudio.paInt6))
    sound_file.setframerate(SAMPLE_RATE)
    sound_file.writeframes(b''.join(frames))       # Note Error: b'' not understood. Only 'RIFF' and 'RIFX' supported.
    sound_file.close()
    print("Finished recording.\n")


def file_mono(convert_file, temp_file, audio_file):
    # Write temporary file
    middle_audio = AudioSegment.from_wav(convert_file)
    print("Imported file contains:", middle_audio.duration_seconds)
    middle_audio = middle_audio[0:middle_audio.duration_seconds * 1000.0]  # Get complete audio duration
    middle_audio.export(f"{temp_file}", format="wav")

    # Properly convert channels
    middle_audio = AudioSegment.from_wav(f"{temp_file}")
    middle_audio = middle_audio.set_channels(CHANNELS)
    middle_audio.export(f"{audio_file}", format="wav")
    print("Channels converted to mono.")


if en_record:
    en_record = input("Record? ")
    if en_record in ("yes", 'y', 'Yes'):
        file_record(audio_file, CHANNELS=CHANNELS, SAMPLE_RATE=SAMPLE_RATE, FramesPB=FramesPB)
elif en_imported:
    file_mono(convert_file, temp_file, audio_file)
# ________________________________________________________________________
# Stage 2: Create note frequency dictionary.
# Can be pre-defined or altered.
# Online Sequencer's range is from C2 to B7 (72 notes)
letter_list = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
octave_list = [2, 3, 4, 5, 6, 7]


def get_note_frequencies(letters, octaves):
    frequencies = []
    rnd, nd = {}, {}
    difference = [0]  # First note has no difference.
    c_letter, c_octave = 0, 0
    for x in range(len(letters) * len(octaves)):
        if c_letter == 12:                             # Count cycle to cycle through
            c_letter = 0                               # Reset letter cycle and move octave up
            c_octave += 1
        formula = 65.41 * 2 ** (x/12)                  # Finds frequency per note
        frequency = round(formula)
        frequencies.append(frequency)                                       # Update frequencies
        rnd.update({frequency: f"{letters[c_letter]}{octaves[c_octave]}"})  # Update reversed dictionary
        nd.update({f"{letters[c_letter]}{octaves[c_octave]}": frequency})   # Update dictionary
        # print(f"{letters[c_letter]}{octaves[c_octave]}: {frequency}"      # Compare/Check
        if x >= 1:                                                          # Finds difference. (Except the first.)
            calc_difference = frequency - frequencies[x-1]
            difference.append(calc_difference)
        c_letter += 1
    if len(frequencies) != len(difference):           # Error check
        return "Error: sizes of note frequencies list and allowance frequency mismatched!"
    return frequencies, difference, rnd, nd


note_frequencies, allowance_per_note, rev_note_dict, note_dict = get_note_frequencies(letter_list, octave_list)
rev_note_dict.update({0: 'X'})  # To filter out blank notes later
rev_note_dict.update({None: 'X'})


# ________________________________________________________________________
# STAGE 3: Get notes per interval
def takeClosest(num, collection):
    return min(collection, key=lambda x: abs(x-num))


def get_note(input_file):
    rate, data = scipy.io.wavfile.read(str(input_file))  # Rate = 48000, Data Norm: [ 0  0 -1 ...  0  0  0]
    sound_data = []

    # Transform with (R) FFT. (Get x and y values)
    try:
        yf = np.abs(rfft(data))                          # gives y (volume) values
    except ValueError:
        yf = [1]
        pass
    _N = 2 * len(yf) - 1                                 # If using rff, len(yf)* 2 - 1.
    xf = rfftfreq(_N, 1 / SAMPLE_RATE)                   # gives x-axis in intervals

    if len(yf) != len(xf):                               # Check
        print("Error: xf and yf size are mismatched!")
    for i in range(len(xf)):                             # Creates list [x, y] (channel must be 1)
        sound_data.append([xf[i], yf[i]])
    # print(sound_data)                                  # Compare/Check (Error. format should be [?.??, ?.??])

    loudest_notes = {}                                   # Stores the notes that made it.
    en_limits = False                                    # Limit to selected note, ex: around C5
    freq_min = note_dict[octave_range[0]]                # Limit allowed frequency range
    freq_max = note_dict[octave_range[1]]

    min_x, max_x = 0, 5000   # Initially this, then en_limits are enabled and changed around a note.
    for x, y in sound_data:                              # Ex: 259.9729194875534 24077682
        if (x > freq_min) and (x < freq_max):            # Ensure within note range, volume & around selected note
            if y >= softness:                            # MANUAL (Error: is your audio file channel 1?)
                if (x <= max_x) and (x >= min_x):
                    current_note = takeClosest(x, note_frequencies)
                    try:                                 # gets the loudest volume (among volume(s)) for each note
                        if y > loudest_notes[current_note]:
                            loudest_notes.update({current_note: round(y)})
                    except KeyError:
                        loudest_notes.update({current_note: round(y)})   # (first time for that note)

                    if not en_limits:                        # only once, limits to selected note (ex: around C5)
                        max_x = current_note + 100           # TBA: Should I change it based on allowance?
                        min_x = current_note - 100
                        en_limits = True

    if loudest_notes:  # Return frequency with the loudest volume
        closest_f = max(loudest_notes, key=loudest_notes.get)
        # print(max(loudest_notes, key=loudest_notes.get), loudest_notes)  # Compare/Check
        return closest_f, loudest_notes[closest_f], xf, yf
    else:    # An empty dictionary gives False.
        return 0, 0, xf, yf


def get_plot(closest_f, closest_f_volume, xf, yf, start, plot_interval):
    plot_skip_0 = False
    if plot_ignore_0:                                      # ENABLE plot_ignore_0: Skips if no note
        if closest_f == 0:
            plot_skip_0 = True
        else:
            plot_skip_0 = False

    if (start >= plot_start) and (not plot_skip_0):        # Allow at starting point and if not skipping 0
        height = 1000000                                   # 1e+6, which is the usual volume
        ceiling = round(5*softness/height)

        # Plot basic graph: all the sound data points for this interval, and the identified note.
        plt.plot(xf, yf, plot_shape, color='red')
        plt.plot(closest_f, closest_f_volume, 'x', color='yellow')
        plt.xlabel("Frequency(Hz)")
        plt.ylabel("Power(dB)")

        note_char = 'C'
        # Gets relevant (char) letter of note and note. (note_name)
        note_name = rev_note_dict[closest_f]
        note_char = note_name[:-1]

        if plot_small_scale:
            # MANUAL: Plot with smaller limits (I mean, who can casually sing B8?)
            plt.xlim([0, 1500])
            plt.ylim([-0.1, None])

            # Print interval details
            m = int(np.floor(start/60000.0))
            s = round((start/60000.0 - m)*60.0, 2)  # 32000 sec
            info = f"{note_name} ({closest_f}) at {start} ms ({m}:{s}, +{plot_interval})"
            plt.figtext(0.12, 0.95, info, wrap=False, horizontalalignment='left', fontsize=12)
        else:
            plt.xlim([0, plot_range])           # MANUAL
            plt.ylim([-0.1, None])
        # Plot frequency (vertical lines)
        for i in range(len(note_frequencies)):
            x = note_frequencies[i]

            # Plot division lines.                                                        Plot the lines from the:
            # if (int(rev_note_dict[x][-1]) == int(note_name[-1])) and plot_small_scale:  # 1: same octave
            if str(rev_note_dict[x][:-1]) == note_char and plot_small_scale:              # 2: same letter
                set_color = 'blue'
                width = 1
            else:  # Plots every other note line
                set_color = 'white'
                width = 5 / (len(note_frequencies) - i)
            plot([x, x], [0, ceiling * height], color=set_color, linewidth=width)
        # Plot volume (every height or 1+e6)
        for i in range(ceiling):
            plot([0, plot_range], [i * height, i * height], color='grey', linewidth=0.5)
        plot([0, plot_range], [softness, softness], color='green', linewidth=1)

        if plot_close:  # [TBA] This... could use work
            plt.show(block=False)
            plt.pause(3)
            plt.close()
        else:
            plt.show()

        # Prints previous note, before next one starts
        for i in range(len(note_frequencies)):
            x = note_frequencies[i]
            if (str(rev_note_dict[x]) == note_name):
                set_color = 'yellow'
                width = 1
                plot([x, x], [0, ceiling * height], color=set_color, linewidth=width)
                plt.figtext(0.18, 0.89, f"[Prev: {note_name} ({closest_f}) at {start}]", wrap=False, horizontalalignment='left', fontsize=9, c='yellow')


file = wave.open(audio_file, mode="rb")                                  # Frames = seconds * Frame rate (48000)
duration = round(1000 * file.getnframes() / float(file.getframerate()))  # round in milliseconds
print("Audio time (ms):", duration)
# file.close()
f_sequence = []
note_sequence = []
start, end = 0, 0

# Loop by interval
if not en_plotter:
    print("\nNow getting notes...\nTime:", round(time.time() - conversion_start, 2))
if en_smooth_filter:  # For plotting interval
    plot_interval = float(interval/s_interval)
while end < duration:
    if en_smooth_filter:  # CHECK SOFTNESS <!>
        end = start + interval  # Redefine end time
        s_end = 0
        s_start = start
        # print(f"\nInterval {start} - {end}")  # Check [if intervals are correct]
        for i in range(s_interval):
            s_end = start + (plot_interval * (i+1))  # Ex: 3/4 times * interval.
            # print(f"Sub {i+1}: {s_start} - {s_end}")  # Check [if intervals are correct]
            temp_audio = AudioSegment.from_wav(audio_file)
            temp_audio = temp_audio[s_start:s_end]
            temp_audio.export(temp_file, format="wav")

            # file = wave.open(temp_file, mode="rb")  # Frames = seconds * Frame rate (48000)
            # new_duration = round(1000 * file.getnframes() / float(file.getframerate()))  # round in ms
            # print("time (ms):", new_duration)  # Check [if it actually got the frames]
            temp, temp_volume, t_xf, t_yf = get_note(temp_file)  # Same thing but different start
            if en_plotter:
                get_plot(temp, temp_volume, t_xf, t_yf, s_start, plot_interval)
            f_sequence.append(temp)                              # Insert note to sequence (specific interval)

            s_start = s_end                                      # + (interval * i / float(s_interval))
        start += interval                                        # Move up the starting time.

    else:  # Basically 4 times, why did I do this again?
        end = start + interval                          # Redefine end time
        temp_audio = AudioSegment.from_wav(audio_file)  # Create a temporary file within interval
        temp_audio = temp_audio[start:end]              # Get audio within interval
        temp_audio.export(temp_file, format="wav")

        temp, temp_volume, t_xf, t_yf = get_note(temp_file)
        if en_plotter:
            get_plot(temp, temp_volume, t_xf, t_yf, start, interval)
        f_sequence.append(temp)                         # Insert note to sequence (specific interval)
        start += interval                               # Move up the starting time.

if en_print_notes >= 2:
    print(f"Pre-filtered:\n{f_sequence}")           # Pre-filtered Audio frequency list
if not en_plotter:
    print("\nNow filtering notes...", round(time.time() - conversion_start, 2))
if en_smooth_filter:  # I don't want to think anymore
    interval = interval / s_interval
    temp_sequence = f_sequence
    for i in range(len(temp_sequence))[1:-1]:  # Except first and last, if surrounding notes are not the same,
        try:
            no_A, no_B, no_C, no_D, no_E = temp_sequence[i-2], temp_sequence[i-1], temp_sequence[i], temp_sequence[i+1], temp_sequence[i+2]
            if (no_A == no_B == no_C == 0):                                # Case 0: Zero skip
                continue
            elif ((no_B > no_C > no_D) or (no_B < no_C < no_D)) and smooth_gate >= 3:
                # print("rising or falling", no_A, no_B, no_C, no_D, no_E)   # Case 1: 3 Rising or falling
                continue
            elif ((no_A == no_B == no_D == no_E) and no_C == 0) and smooth_gate >= 2:
                # print("repeated", no_A, no_B, no_C, no_D, no_E)            # Case 2: repeated note, keep 0
                continue
            elif (no_C != no_D and no_C != no_B) and (no_B != 0 and no_D != 0) and smooth_gate >= 1:
                # print("redundant",  no_A, no_B, no_C, no_D, no_E)          # Case 3: short redundant note, absorbed
                f_sequence[i] = no_B
        except IndexError:
            pass

for i in f_sequence:  # Frequency to Note
    note = rev_note_dict[i]
    note_sequence.append(note)
# ________________________________________________________________________
# Stage 4: Generate paste
# Default example [Online Sequencer:629405:0 C5 1 43;:] where pos, note, length, instrument = "0", "C5", "1", 43
if en_instrument:                # If Instrument not provided.
    instrument = input("\nWhich instrument would you like? Please provide the number.\n'Electric Piano' = 43\n'Grand Piano' = 41\n'Music Box' = 26\n'Acoustic Guitar' = 1\n'Smooth Synth' = 3\n'Flute' = 23\n'Steel Drums' = 21\n\nInstrument: ")
if not isinstance(instrument, int):
    instrument = 43             # Default to 43 if none selected.
if en_print_notes >= 2:
    print(f"Aft filtered:\n{f_sequence}")           # Audio frequency list
    print(f"Note version:\n{note_sequence}")        # Audio note list


def generate_interval_marker(duration, interval_range, interval_manual):
    if interval_range[1] is None:                         # Convert second to millisecond.
        interval_range[1] = duration                      # If max = None, set total frames.
        interval_range[0] = interval_range[0] * 1000
    else:
        interval_range = [r * 1000 for r in interval_range]

    interval_sequence = ""                          # Initialize
    t = round((interval_range[0] / interval_manual)) * interval_manual  # Start at the selected value. [w/ respect to 0]
    while t <= interval_range[1]:                           # t increases by intervals until range reached.
        interval_sequence += f"{round((t/150.0) * (BPM / 100.0), 5)} {interval_note} {interval_width} {interval_instrument};"
        t += interval_manual  # Move position to next interval.
    return f"Online Sequencer:0:{interval_sequence}:\n"


def generate_paste(sequence, instrument, start_pos):
    node_sequence = ""  # String to be generated
    note_interval = (interval / 150.0) * (BPM / 100.0)
    node_pos = start_pos
    zero_count = 0
    final_sequence_length = 0
    node_length = note_interval
    print("Each note increases by", round(note_interval, 5))  # Can use random functions to test formatting.
    number_of_notes = len(sequence)
    final_inst = instrument
    # Case 1: note is 0 - move up position but don't print
    # Case 2: existing note, only one such instance - print immediately
    # Case 3: existing similar notes - continue but inc length until the end to be combined as one
    # Case 4: last note - avoid with "index fix"
    sequence.append(0)  # Placeholder last note (index fix)
    for i in range(number_of_notes):
        if sequence[i] != 'X':  # Ignore empty notes.
            if sequence[i] == sequence[i + 1]:  # If similar, combine notes ahead
                node_length += note_interval  # Keep position the same while increasing its length
            else:  # Otherwise, print and move up
                # print(i, sequence[i], round(node_pos, 3), "for", round(node_length, 3))  # Combine test print
                if en_smooth_filter and en_short_flag:  # Flags tiny notes
                    if (sequence[i] != sequence[i + 1]) and (sequence[i] != sequence[i - 1]):
                        final_inst = short_instrument
                if en_grid_length:  # reshapes it to fit grid. does not affect the rest of the code.
                    multiplier = 4*GRID
                    grid_pos = math.floor(round(node_pos, 5)/multiplier)*multiplier
                    grid_length = ceil(round(node_length, 5)/multiplier)*multiplier
                    node_sequence += f"{grid_pos} {sequence[i]} {grid_length} {final_inst};"
                else:
                    node_sequence += f"{round(node_pos, 5)} {sequence[i]} {round(node_length, 5)} {final_inst};"
                node_pos += node_length  # Move onto next pos
                node_length = note_interval  # Reset length
                final_sequence_length += 1
            if en_smooth_filter and en_short_flag:  # Refix
                final_inst = instrument
        else:
            zero_count += 1
            node_pos += note_interval  # Position of 0s must also be taken into account.

    return f"\nOnline Sequencer:0:{node_sequence}:", final_sequence_length, zero_count


if en_interval_marker:  # ENABLE line for INTERVAL MARKER
    generated_intervals = generate_interval_marker(duration, interval_range, interval_manual)
    print(f"\nIntervals generated:\n{generated_intervals}")

generated, final_sequence_length, empty = generate_paste(note_sequence, instrument, start_pos)
if generated == "Online Sequencer:0::":
    print("Error: No notes. Is your mic muted?")

if en_print_notes >= 1:        # Writes info in file.
    print(f"{generated}")      # Note: emulating console prevents copy/pasting in one line.
    print(len(note_sequence), "generated notes.", empty, "empty notes.", final_sequence_length, "notes.")
    if not en_plotter:
        print("Time taken to convert:", round(time.time() - conversion_start, 2))
if en_print_notes >= 3:
    f = open('Sequence_Output.txt', "w")
    f.write(f"{audio_file} - Audio time (ms): {duration}")
    f.write(f"{str(generated)}")
    f.write(f"\nTime taken to convert: {round(time.time() - conversion_start, 2)}")
    f.write(f"\n\nNumber of notes: {final_sequence_length} ({empty} empty, {len(note_sequence)} total)")
    f.write(f"\nNote Interval: {(interval / 150.0) * (BPM / 100.0)} ms")
    f.write(f"\nGenerated Freq sequence: {f_sequence}\nGenerated Note sequence: {note_sequence}")

    f.write("\n\nIrrelevant details:")
    f.write(f"\nInstrument [{instrument}], Interval [{interval}], s_interval [{s_interval}], BPM [{BPM}], Softness [{softness}], Octave Range [{octave_range}]")
    f.write(f"\nen_imported [{en_imported}]| en_grid_length [{en_grid_length}]| en_smooth_filter [{en_smooth_filter}]| en_short_flag [{en_short_flag}]")
    f.write(f"\nNote frequencies: {note_frequencies}\nNote Allowance: {allowance_per_note}\nNote dictionary: {rev_note_dict}")
    if en_interval_marker:
        f.write(f"\n\nGenerated Intervals: \n{generated_intervals}\n, interval_manual [{interval_manual}]")

    f.close()
"""
Goal: Make a *quality* audio to *simple* note plotter. about 300 lines oh yeah~

Pre-Versions: (contained in other .py files)
- v0: Randomly Generated notes
- v0.1: Basic Note compiler
- v0.2: w/ Recorder
- v0.4: fft with plotter
- v0.5: interval splitting
- v0.6: 4+5 testing
 
Version 1: Basic Averaging
- Very bad. Harmonic values exist that are far apart and will give a completely wrong frequency.
- My recording was distorted because I didn't make the sample frequency equal. Silly me!
- Scrapped "Allowance" and "max_count" to consider surrounding notes. Too ineffective.
- Plot feature
Version 2: Take Closest note
- Reduced notes dramatically but many filler and inaccurate notes still exist.
- Combine Similar Notes, Ignore 0s support. (Interval Fixing)
- Skip, scale, ignore 0s on plot. (Plot features)
Version 3: BPM support (Interval Fixing)
- Import support
- Color, Note at specific interval (Plot features)
- Octave Range
- Note filtering count: Empty notes, Initial notes, Final filtered notes
Version 4: Note editing
- Smooth filtering: rise & fall, repeated, absorb too short
- Flag notes that are too short
- Interval Markers
- Grid Adjustment

Notes
- It favors lower octaves (due to en_limits, see graph) and may be biased in choosing frequencies (get nearest, not based on logarithmic difference)
- Reducing interval or increasing s_interval dramatically increases the time taken.

- Why didn't I just reduce the normal interval? IDK i can't be bothered anymore
- i'm too lazy to slice a specific range
- Okay why are there secret drum kits now? like 90053
- I completely forgot to check the sub interval so this whole time it was slightly wrong every 1/4 clip WHOOPS


FINAL OBJECTIVE: finding values
1. optimal interval window to limit to one frequency: ~0.2s for 3 max count
2. optimal threshold (softness) to select frequency
3. allowance & how to actually get the intended value

f = 1/T, ex: highest frequency wavelength of 0.25310048ms so min time window = 0.015s = 15ms???

? = Incomplete          Project "fa-mi-la-ti so-re-do"
References this: Online Sequencer:776429:7 C5 1 21;6 D5 1 21;1 E5 1 21;0 F5 1 21;5 G5 1 21;2 A5 1 21;3 B5 1 21;:

Even if all are ticked, it doesn't mean I am done. (The code is really messy and could be cleaned up.)
I have committed the grave sin of having global variables inside functions

✅ 1. Record audio file [pyaudio & wave]
✅ 2. Get x & y values [scipy.io - wavefile, numpy]
✅ 3. Successful (quality*) filtering
✅ 4. Get the nearest NOTE list (per xms) [pydub]

✅ 5. Fit each note into a "beat" (0.15s, interval based)
✅ 6. Filter & Estimate note length [if 2 next to each other, combine]
✅ 7. Personalized grid adjustment

✅ 8. Instrument Picker [I should have used array]
✅ 9. Compile all the notes into one long sequence to paste

✅ 10. Graph for note (pitch) [matplotlib]
✅ 11. Importing support

How am I supposed to do drums?!?! the "note" becomes an instrument picker ._. """
