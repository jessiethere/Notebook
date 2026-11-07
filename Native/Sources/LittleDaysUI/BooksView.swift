import SwiftUI
import LittleDaysCore

struct BooksView: View {
    @EnvironmentObject private var store: NativeStore
    let openStudio: (String) -> Void
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text(store.t("books.title")).font(.system(size: 32, design: .serif))
                ForEach(store.state.books) { book in
                    VStack(alignment: .leading, spacing: 15) {
                        HStack { BookCoverView(book: book).frame(width: 85, height: 115); VStack(alignment: .leading) { Text(book.title).font(.headline); Text(book.category).font(.caption).foregroundStyle(.secondary) } }
                        ForEach(store.state.entries.filter { $0.bookId == book.id }) { entry in
                            Button { openStudio(entry.date) } label: { HStack { Text(entry.title).font(.subheadline); Spacer(); Text(entry.date).font(.caption2) } }
                        }
                    }.padding(20).background(store.color(book.color).opacity(0.5), in: RoundedRectangle(cornerRadius: 18))
                }
            }.padding(23)
        }
    }
}
