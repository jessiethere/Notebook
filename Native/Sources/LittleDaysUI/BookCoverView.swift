import SwiftUI
import UIKit
import LittleDaysCore

struct BookCoverView: View {
    @EnvironmentObject private var store: NativeStore
    let book: JournalBook
    var body: some View {
        ZStack(alignment: .leading) {
            store.color(book.color)
            VStack(spacing: 9) {
                Text(book.title).font(store.font(book.coverFont ?? "elegant", size: 15)).multilineTextAlignment(.center).lineLimit(3)
                if let asset = store.catalog.stickers.first(where: { $0.id == (book.coverDecoration ?? "tulip") }), let data = try? SharedResources.libraryData(category: "stickers", filename: asset.nativeFile), let image = UIImage(data: data) {
                    Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 45)
                }
                Text("LITTLE DAYS").font(.system(size: 6)).tracking(1.7).opacity(0.5)
            }.padding(.leading, 15).padding(.trailing, 10).padding(.vertical, 15).frame(maxWidth: .infinity, maxHeight: .infinity)
            Rectangle().fill(.black.opacity(0.05)).frame(width: 6).padding(.leading, 6)
        }
        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(.white.opacity(0.35), lineWidth: 1).padding(8))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
